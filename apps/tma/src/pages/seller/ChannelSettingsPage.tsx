import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, bustCache } from '@/lib/api';
import { useMainButton } from '@/lib/useMainButton';
import { useTelegram } from '@/providers/TelegramProvider';
import { useTranslation } from '@/lib/i18n';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001 — UI v2 (06.2026):
 *
 * Полностью переработанный UX. Вместо raw HTML/Mustache textarea — простой
 * режим с чекбоксами «что показывать в посте» и текстом подписи (без HTML).
 *
 * Backend контракт НЕ ПОМЕНЯЛСЯ — store.channelPostTemplate остаётся
 * Mustache-строкой. UI компилирует выбор чекбоксов + префикс в Mustache
 * шаблон при сохранении (см. `composeTemplate`). При загрузке пытаемся
 * распарсить обратно (см. `parseTemplate`); если шаблон не распознан как
 * сгенерированный нашим UI — переключаемся в «Расширенный режим» с raw
 * textarea (обратная совместимость для тех кто уже редактировал HTML).
 *
 * Live preview визуализирует пост как mock TG-карточка с фото-плейсхолдером
 * и кнопкой «Открыть товар», а не как голый HTML.
 */

// ─── Sections (чекбоксы) ──────────────────────────────────────────────────
type SectionKey = 'title' | 'price' | 'description' | 'photo' | 'buyButton';
const ALL_SECTIONS: SectionKey[] = ['title', 'price', 'description', 'photo', 'buyButton'];

interface ChannelTemplate {
  id: string;
  channelPostTemplate: string | null;
  channelContactPhone: string | null;
  channelInstagramLink: string | null;
  channelTiktokLink: string | null;
  telegramChannelId: string | null;
  telegramChannelTitle: string | null;
  telegramContactLink: string | null;
  autoPostProductsToChannel: boolean;
  defaultTemplate: string;
}

interface PreviewResult {
  caption: string;
  sampleProductId: string | null;
  sampleProductTitle: string | null;
}

interface SimpleConfig {
  prefix: string;
  sections: Record<SectionKey, boolean>;
}

const ACCENT = '#A855F7';
const ACCENT_DARK = '#7C3AED';

const DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  title: true,
  price: true,
  description: true,
  photo: true,         // photo — не контролирует caption, только media (backend сам прикрепит)
  buyButton: true,
};

/**
 * Маркер «этот шаблон сгенерирован нашим UI v2». Используется чтобы безопасно
 * распарсить обратно — иначе обращаемся в Advanced-режим.
 */
const TEMPLATE_MARKER = '<!--SAVDO_UI_V2-->';

/**
 * Скомпилировать SimpleConfig → Mustache-строку для backend.
 * Сохраняем порядок секций как в ALL_SECTIONS (title → price → description → buy).
 * Контакты подставляются ВСЕГДА (если заполнены) — это базовая информация,
 * вообще не часть чекбоксов.
 */
function composeTemplate(cfg: SimpleConfig): string {
  const lines: string[] = [TEMPLATE_MARKER];

  const prefix = cfg.prefix.trim();
  if (prefix) {
    // Префикс — это статичный текст без HTML, экранируем угловые скобки руками
    // (на бэке всё равно sanitize, но лучше отдать чистый текст).
    const safe = prefix.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    lines.push(safe, '');
  }

  if (cfg.sections.title) {
    lines.push('<b>{{title}}</b>');
  }
  if (cfg.sections.price) {
    lines.push('💰 {{price}}{{#hasOldPrice}} <s>{{oldPrice}}</s>{{/hasOldPrice}}');
  }
  if (cfg.sections.description) {
    lines.push('{{#description}}{{description}}{{/description}}');
  }

  // Контакты — всегда (независимо от чекбоксов). Пустые поля схлопнутся
  // через {{#var}}…{{/var}} (renderSections отрендерит пусто).
  lines.push('');
  lines.push('{{#contact}}📞 {{contact}}{{/contact}}');
  lines.push('{{#instagram}}📷 {{instagram}}{{/instagram}}');
  lines.push('{{#tiktok}}🎵 {{tiktok}}{{/tiktok}}');

  if (cfg.sections.buyButton) {
    lines.push('');
    lines.push('<a href="{{productUrl}}">Открыть товар →</a>');
  }

  return lines.join('\n');
}

/**
 * Распарсить Mustache-шаблон обратно в SimpleConfig.
 * Возвращает null если это НЕ наш сгенерированный шаблон (нет маркера) —
 * тогда UI откроет Advanced-режим с raw textarea.
 *
 * Эвристика: распознаём шаблон по маркеру в первой строке. Префикс — это
 * первая непустая строка после маркера, до первой Mustache-конструкции.
 */
function parseTemplate(tpl: string | null | undefined): SimpleConfig | null {
  if (!tpl) {
    // null = ещё не сохраняли — стартуем с дефолтных секций без префикса
    return { prefix: '', sections: { ...DEFAULT_SECTIONS } };
  }
  const trimmed = tpl.trimStart();
  if (!trimmed.startsWith(TEMPLATE_MARKER)) {
    return null;  // чужой / legacy / ручной HTML — advanced mode
  }

  const body = trimmed.slice(TEMPLATE_MARKER.length).replace(/^\n+/, '');

  // Префикс — всё до первой Mustache переменной или HTML-тега <b>
  const sectionStart = body.search(/\{\{|<b>/);
  const prefixRaw = sectionStart > 0 ? body.slice(0, sectionStart).trim() : '';
  const prefix = prefixRaw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  const sections: Record<SectionKey, boolean> = {
    title: /\{\{title\}\}/.test(body),
    price: /\{\{price\}\}/.test(body),
    description: /\{\{description\}\}/.test(body),
    // photo всегда true — мы не выключаем фото через шаблон, но для UI
    // сохраним последний выбор пользователя в localStorage чуть ниже.
    photo: true,
    buyButton: /\{\{productUrl\}\}/.test(body),
  };

  return { prefix, sections };
}

// ─── UI primitives ────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={on}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? ACCENT : 'var(--tg-border)',
        border: 'none', cursor: disabled ? 'wait' : 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.18s',
        }}
      />
    </button>
  );
}

function Checkbox({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex items-center gap-3 w-full text-left py-2 px-1 rounded-lg"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        minHeight: 44, // hit-area 48px-ish
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22, height: 22, borderRadius: 6,
          background: checked ? ACCENT : 'transparent',
          border: `2px solid ${checked ? ACCENT : 'var(--tg-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm" style={{ color: 'var(--tg-text-primary)' }}>{label}</span>
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--tg-surface-hover)',
  border: '1px solid var(--tg-border)',
  color: 'var(--tg-text-primary)',
};

// ─── Main page ────────────────────────────────────────────────────────────
export default function ChannelSettingsPage() {
  const { tg } = useTelegram();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState<ChannelTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple-mode state
  const [prefix, setPrefix] = useState('');
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({ ...DEFAULT_SECTIONS });

  // Advanced-mode state (raw template, fallback для legacy)
  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedTemplate, setAdvancedTemplate] = useState('');

  // Contacts
  const [contactPhone, setContactPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Auto-post toggle
  const [autoPost, setAutoPost] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [togglingAutoPost, setTogglingAutoPost] = useState(false);

  // Preview
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Refs
  const loadAbortRef = useRef<AbortController | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);

  // Initial original (для dirty-detection)
  const originalRef = useRef<{
    template: string | null;
    contactPhone: string | null;
    instagram: string | null;
    tiktok: string | null;
  }>({ template: null, contactPhone: null, instagram: null, tiktok: null });

  // ─── Load on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    loadAbortRef.current?.abort();
    const ac = new AbortController();
    loadAbortRef.current = ac;
    api<ChannelTemplate>('/seller/store/channel-template', { signal: ac.signal, forceFresh: true })
      .then((d) => {
        if (ac.signal.aborted) return;
        setData(d);
        setContactPhone(d.channelContactPhone ?? '');
        setInstagram(d.channelInstagramLink ?? '');
        setTiktok(d.channelTiktokLink ?? '');
        setAutoPost(d.autoPostProductsToChannel);

        originalRef.current = {
          template: d.channelPostTemplate,
          contactPhone: d.channelContactPhone,
          instagram: d.channelInstagramLink,
          tiktok: d.channelTiktokLink,
        };

        // Распарсить шаблон → simple / advanced
        const parsed = parseTemplate(d.channelPostTemplate);
        if (parsed) {
          setPrefix(parsed.prefix);
          setSections(parsed.sections);
          setAdvancedMode(false);
          setAdvancedTemplate(d.channelPostTemplate ?? d.defaultTemplate);
        } else {
          // Legacy / ручной — открываем advanced
          setAdvancedMode(true);
          setAdvancedTemplate(d.channelPostTemplate ?? d.defaultTemplate);
        }
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        showToast(t('seller.channel.loadError'), 'error');
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Compose current template (для save и preview) ──────────────────────
  const currentTemplate = useMemo(() => {
    if (advancedMode) return advancedTemplate;
    return composeTemplate({ prefix, sections });
  }, [advancedMode, advancedTemplate, prefix, sections]);

  // ─── Live preview (debounced) ───────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      previewAbortRef.current?.abort();
      const ac = new AbortController();
      previewAbortRef.current = ac;
      setPreviewLoading(true);
      api<PreviewResult>('/seller/store/channel-template/preview', {
        method: 'POST',
        body: { template: currentTemplate || undefined },
        signal: ac.signal,
        noCache: true,
      })
        .then((p) => { if (!ac.signal.aborted) setPreview(p); })
        .catch((err: unknown) => {
          if (ac.signal.aborted) return;
          if (err instanceof Error && err.name === 'AbortError') return;
          // tichaya — preview не критичен
        })
        .finally(() => { if (!ac.signal.aborted) setPreviewLoading(false); });
    }, 400);
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [currentTemplate, contactPhone, instagram, tiktok, data]);

  // ─── Dirty detection ────────────────────────────────────────────────────
  const dirty = useMemo(() => {
    if (!data) return false;
    const orig = originalRef.current;
    return (
      (currentTemplate || null) !== orig.template ||
      (contactPhone || null) !== orig.contactPhone ||
      (instagram || null) !== orig.instagram ||
      (tiktok || null) !== orig.tiktok
    );
  }, [data, currentTemplate, contactPhone, instagram, tiktok]);

  // ─── Save ────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!data || saving) return;
    setSaving(true);
    try {
      await api('/seller/store/channel-template', {
        method: 'PATCH',
        body: {
          channelPostTemplate: currentTemplate,
          channelContactPhone: contactPhone,
          channelInstagramLink: instagram,
          channelTiktokLink: tiktok,
        },
      });
      bustCache('/seller/store/channel-template');
      originalRef.current = {
        template: currentTemplate || null,
        contactPhone: contactPhone || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
      };
      setData((prev) => prev && {
        ...prev,
        channelPostTemplate: currentTemplate || null,
        channelContactPhone: contactPhone || null,
        channelInstagramLink: instagram || null,
        channelTiktokLink: tiktok || null,
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast(t('seller.channel.saved'));
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : t('seller.channel.saveError');
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [data, saving, currentTemplate, contactPhone, instagram, tiktok, tg, t]);

  useMainButton({
    text: saving ? t('seller.channel.saving') : t('seller.channel.save'),
    onClick: save,
    visible: !loading && dirty,
    enabled: !saving,
    loading: saving,
  });

  // ─── Auto-post toggle ───────────────────────────────────────────────────
  const toggleAutoPost = useCallback(async () => {
    if (!data || togglingAutoPost) return;
    if (!data.telegramChannelId) {
      showToast(t('seller.channel.needChannelFirst'), 'error');
      return;
    }
    const next = !autoPost;
    setTogglingAutoPost(true);
    setAutoPost(next);
    try {
      await api('/seller/store', { method: 'PATCH', body: { autoPostProductsToChannel: next } });
      tg?.HapticFeedback.selectionChanged();
      showToast(next ? t('seller.channel.autopost.on') : t('seller.channel.autopost.off'));
    } catch {
      setAutoPost(!next);
      showToast(t('seller.channel.autopost.toggleError'), 'error');
    } finally {
      setTogglingAutoPost(false);
    }
  }, [data, autoPost, togglingAutoPost, tg, t]);

  // ─── Test post ──────────────────────────────────────────────────────────
  const sendTestPost = useCallback(async () => {
    if (testing) return;
    if (dirty) {
      showToast(t('seller.channel.test.dirty'), 'error');
      return;
    }
    setTesting(true);
    try {
      const res = await api<{ posted: boolean; reason?: string }>(
        '/seller/store/channel-test-post',
        { method: 'POST', body: {}, noCache: true },
      );
      if (res.posted) {
        tg?.HapticFeedback.notificationOccurred('success');
        showToast(t('seller.channel.test.success'));
      } else {
        tg?.HapticFeedback.notificationOccurred('warning');
        showToast(t('seller.channel.test.failed', { reason: res.reason ?? 'unknown' }), 'error');
      }
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : t('seller.channel.test.error');
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setTesting(false);
    }
  }, [testing, dirty, tg, t]);

  // ─── Section toggle ──────────────────────────────────────────────────────
  const toggleSection = (key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    tg?.HapticFeedback.selectionChanged();
  };

  // ─── Switch advanced/simple ──────────────────────────────────────────────
  const switchToSimple = () => {
    // Попытаемся распарсить advanced → simple. Если не получится — алёрт.
    const parsed = parseTemplate(advancedTemplate);
    if (!parsed) {
      if (!confirm('Текущий HTML-шаблон будет заменён на простой режим. Продолжить?')) return;
      setPrefix('');
      setSections({ ...DEFAULT_SECTIONS });
    } else {
      setPrefix(parsed.prefix);
      setSections(parsed.sections);
    }
    setAdvancedMode(false);
    tg?.HapticFeedback.selectionChanged();
  };

  const switchToAdvanced = () => {
    // Скомпилируем текущий simple → advanced как стартовая точка
    setAdvancedTemplate(composeTemplate({ prefix, sections }));
    setAdvancedMode(true);
    tg?.HapticFeedback.selectionChanged();
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <Skeleton style={{ height: 24, width: '50%' }} />
        <Skeleton style={{ height: 80 }} />
        <Skeleton style={{ height: 140 }} />
        <Skeleton style={{ height: 260 }} />
      </div>
    );
  }

  const channelAttached = !!data?.telegramChannelId;
  const channelUsername = data?.telegramChannelId
    ? (data.telegramChannelId.startsWith('@') ? data.telegramChannelId : `@${data.telegramChannelId.replace(/^-100\d+$/, data.telegramChannelTitle ?? '')}`)
    : '';

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pb-24">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ color: 'var(--tg-text-secondary)', background: 'var(--tg-surface)' }}
        >
          {t('seller.channel.back')}
        </button>
        <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>
          {t('seller.channel.title')}
        </h1>
      </div>

      {/* ── 1. Авто-постинг (top-level toggle) ── */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
          {t('seller.channel.autopost.header')}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--tg-text-primary)' }}>
              {t('seller.channel.autopost.title')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tg-text-muted)' }}>
              {t('seller.channel.autopost.desc')}
            </p>
          </div>
          <Toggle
            on={autoPost && channelAttached}
            onChange={toggleAutoPost}
            disabled={togglingAutoPost || !channelAttached}
          />
        </div>
        {!channelAttached && (
          <p className="text-xs" style={{ color: '#FBBF24' }}>
            {t('seller.channel.autopost.needChannel')}
          </p>
        )}
      </GlassCard>

      {/* ── 2. Канал (показываем если auto-post ON или канал привязан) ── */}
      {(autoPost || channelAttached) && (
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('seller.channel.binding.header')}
          </p>
          {channelAttached ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
                  {t('seller.channel.binding.channelLabel')}
                </label>
                <input
                  value={data?.telegramChannelTitle ?? channelUsername}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <p className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
                {t('seller.channel.binding.changeViaBot')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
                {t('seller.channel.binding.notAttached')}
              </p>
              <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
                {t('seller.channel.binding.hint')}
              </p>
            </>
          )}
        </GlassCard>
      )}

      {/* ── 3. Что показывать (чекбоксы) — только в simple-режиме ── */}
      {!advancedMode && (
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('seller.channel.content.header')}
          </p>
          <p className="text-xs mb-1" style={{ color: 'var(--tg-text-muted)' }}>
            {t('seller.channel.content.desc')}
          </p>

          <div className="flex flex-col gap-0">
            {ALL_SECTIONS.map((key) => (
              <Checkbox
                key={key}
                checked={sections[key]}
                onChange={() => toggleSection(key)}
                label={t(`seller.channel.content.${key}`)}
              />
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── 4. Префикс (текст подписи) — только simple ── */}
      {!advancedMode && (
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('seller.channel.prefix.header')}
          </p>
          <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
            {t('seller.channel.prefix.desc')}
          </p>
          <textarea
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            rows={3}
            spellCheck={true}
            maxLength={300}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
            placeholder={t('seller.channel.prefix.ph')}
          />
        </GlassCard>
      )}

      {/* ── 5. Advanced (raw HTML) — collapsed by default ── */}
      <GlassCard className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('seller.channel.advanced.toggle')}
          </p>
          <button
            onClick={advancedMode ? switchToSimple : switchToAdvanced}
            className="text-xxs px-2 py-1 rounded-lg"
            style={{ color: ACCENT, background: 'rgba(168,85,247,0.10)' }}
          >
            {advancedMode ? t('seller.channel.advanced.simple') : 'HTML →'}
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
          {t('seller.channel.advanced.desc')}
        </p>
        {advancedMode && (
          <>
            <p className="text-xs" style={{ color: '#FBBF24' }}>
              {t('seller.channel.advanced.warn')}
            </p>
            <textarea
              value={advancedTemplate}
              onChange={(e) => setAdvancedTemplate(e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 220 }}
              placeholder={data?.defaultTemplate}
            />
          </>
        )}
      </GlassCard>

      {/* ── 6. Контакты ── */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
          {t('seller.channel.contacts.header')}
        </p>
        <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
          {t('seller.channel.contacts.desc')}
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
            {t('seller.channel.contacts.phone')}
          </label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder={t('seller.channel.contacts.phonePh')}
            inputMode="tel"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
            {t('seller.channel.contacts.instagram')}
          </label>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder={t('seller.channel.contacts.instagramPh')}
            inputMode="url"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
            {t('seller.channel.contacts.tiktok')}
          </label>
          <input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder={t('seller.channel.contacts.tiktokPh')}
            inputMode="url"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </GlassCard>

      {/* ── 7. Preview (TG mock card) ── */}
      <GlassCard className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            {t('seller.channel.preview.header')}
          </p>
          {previewLoading && (
            <span className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
              {t('seller.channel.preview.loading')}
            </span>
          )}
        </div>

        {preview ? (
          <TgMockCard
            caption={preview.caption}
            showPhoto={advancedMode ? true : sections.photo}
            showBuyButton={advancedMode ? /productUrl/.test(currentTemplate) : sections.buyButton}
            photoLabel={t('seller.channel.preview.photoLabel')}
            buyLabel={t('seller.channel.preview.buyBtn')}
          />
        ) : (
          <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
            {t('seller.channel.preview.empty')}
          </p>
        )}

        {preview?.sampleProductTitle && (
          <p className="text-xxs mt-1" style={{ color: 'var(--tg-text-dim)' }}>
            {t('seller.channel.preview.sampleNote', { title: preview.sampleProductTitle })}
          </p>
        )}
      </GlassCard>

      {/* ── 8. Тестовый пост ── */}
      <GlassCard className="p-4 flex flex-col gap-2">
        <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
          {t('seller.channel.test.header')}
        </p>
        <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
          {t('seller.channel.test.desc')}
        </p>
        <button
          onClick={sendTestPost}
          disabled={testing || !channelAttached || dirty}
          className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1"
          style={{
            background: testing || !channelAttached || dirty
              ? 'var(--tg-surface)'
              : `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`,
            color: testing || !channelAttached || dirty ? 'var(--tg-text-dim)' : '#fff',
            transition: 'all 0.15s',
          }}
        >
          {testing ? t('seller.channel.test.sending') : t('seller.channel.test.btn')}
        </button>
        {dirty && (
          <p className="text-xxs" style={{ color: '#FBBF24' }}>
            {t('seller.channel.test.dirty')}
          </p>
        )}
      </GlassCard>

      {/* In-form fallback CTA для dev без TG */}
      {!tg && (
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: saving || !dirty ? 'var(--tg-surface)' : `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`,
            color: saving || !dirty ? 'var(--tg-text-dim)' : '#fff',
          }}
        >
          {saving ? t('seller.channel.saving') : t('seller.channel.save')}
        </button>
      )}
    </div>
  );
}

// ─── TG Mock Card (Preview визуализация в TMA-стиле) ──────────────────────
function TgMockCard({
  caption, showPhoto, showBuyButton, photoLabel, buyLabel,
}: { caption: string; showPhoto: boolean; showBuyButton: boolean; photoLabel: string; buyLabel: string }) {
  // Visual mock «как пост выглядит в Telegram». Не реальный TG-стиль, но
  // даёт продавцу понимание структуры: фото сверху, ниже caption, ниже
  // inline-кнопка. Тема (light/dark) подтягивается из CSS-переменных TMA.
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--tg-surface)',
        border: '1px solid var(--tg-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* Photo placeholder */}
      {showPhoto && (
        <div
          className="w-full flex items-center justify-center"
          style={{
            aspectRatio: '4 / 3',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.25))',
            color: 'var(--tg-text-muted)',
            fontSize: 14,
            position: 'relative',
          }}
        >
          <span style={{ opacity: 0.7 }}>📷 {photoLabel}</span>
        </div>
      )}

      {/* Caption */}
      <div
        className="text-sm px-3 py-3 whitespace-pre-wrap"
        style={{ color: 'var(--tg-text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}
        dangerouslySetInnerHTML={{ __html: caption }}
      />

      {/* Inline button (если включена) */}
      {showBuyButton && (
        <div
          className="px-3 pb-3"
          style={{ borderTop: '1px solid var(--tg-border)', paddingTop: 10 }}
        >
          <div
            className="w-full text-center py-2 rounded-lg text-sm font-semibold"
            style={{
              background: 'rgba(168,85,247,0.10)',
              color: ACCENT,
              border: '1px solid rgba(168,85,247,0.25)',
            }}
          >
            {buyLabel}
          </div>
        </div>
      )}
    </div>
  );
}
