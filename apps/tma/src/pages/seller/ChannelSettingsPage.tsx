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
 * FEAT-TG-CHANNEL-TEMPLATE-001 — UI v3 (06.2026):
 *
 * WYSIWYG card editor. Сам preview-блок ЕСТЬ редактор. Никаких HTML/Mustache
 * наружу. Прозрачные блоки в TG-mock card: tap → popover на каждый блок
 * (видимость / drag-reorder / inline-prefix-text).
 *
 * Backend контракт сохранён: composeTemplate() и parseTemplate() те же
 * функции, что и в v2 — на сервер уходит та же Mustache-строка.
 *
 * Legacy detection (v1 ручной HTML):
 *   parseTemplate(tpl) === null  ⇒  показываем banner НАД preview,
 *   НЕ переключаем в advanced автоматически. Пользователь выбирает:
 *   «Перенести в простой режим» (confirm → DEFAULT_SECTIONS) или
 *   «Открыть в Для разработчиков» (advanced mode внизу страницы).
 *
 * Advanced/HTML escape hatch:
 *   GlassCard disclosure в самом низу, collapsed by default, с confirm
 *   при раскрытии. Скрыт за VITE_TMA_DEV_HTML_ENABLED флагом (если false
 *   — disclosure не рендерится вовсе).
 */

// ─── Blocks ───────────────────────────────────────────────────────────────
type BlockKey = 'prefix' | 'title' | 'photo' | 'price' | 'description' | 'contacts' | 'buyButton';

interface BlockState {
  key: BlockKey;
  visible: boolean;
}

const DEFAULT_BLOCKS: BlockState[] = [
  { key: 'prefix', visible: false },     // hidden by default (empty text)
  { key: 'photo', visible: true },
  { key: 'title', visible: true },
  { key: 'price', visible: true },
  { key: 'description', visible: true },
  { key: 'contacts', visible: true },
  { key: 'buyButton', visible: true },
];

// Какие из блоков влияют на caption-секции в composeTemplate.
// (photo / contacts — отдельная семантика, см. composeTemplate.)
type SectionKey = 'title' | 'price' | 'description' | 'photo' | 'buyButton';
const SECTION_KEYS: SectionKey[] = ['title', 'price', 'description', 'photo', 'buyButton'];

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
  photo: true,
  buyButton: true,
};

/**
 * Маркер «этот шаблон сгенерирован нашим UI v2/v3». Контракт с backend.
 */
const TEMPLATE_MARKER = '<!--SAVDO_UI_V2-->';

/**
 * Скомпилировать SimpleConfig → Mustache-строку для backend.
 * Backend-контракт идентичен v2 — функция не меняется.
 */
function composeTemplate(cfg: SimpleConfig): string {
  const lines: string[] = [TEMPLATE_MARKER];

  const prefix = cfg.prefix.trim();
  if (prefix) {
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

  // Контакты — всегда (независимо от чекбоксов).
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
 * Возвращает null если это НЕ наш шаблон → legacy / ручной HTML.
 */
function parseTemplate(tpl: string | null | undefined): SimpleConfig | null {
  if (!tpl) {
    return { prefix: '', sections: { ...DEFAULT_SECTIONS } };
  }
  const trimmed = tpl.trimStart();
  if (!trimmed.startsWith(TEMPLATE_MARKER)) {
    return null;
  }

  const body = trimmed.slice(TEMPLATE_MARKER.length).replace(/^\n+/, '');
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

const inputStyle: React.CSSProperties = {
  background: 'var(--tg-surface-hover)',
  border: '1px solid var(--tg-border)',
  color: 'var(--tg-text-primary)',
};

// ─── Dev-HTML escape hatch feature flag ───────────────────────────────────
// Если env-флаг === 'false' — disclosure вообще не рендерится. По умолчанию
// показываем (legacy users без флага должны видеть escape hatch).
const DEV_HTML_ENABLED =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_TMA_DEV_HTML_ENABLED !== 'false';

// ─── Main page ────────────────────────────────────────────────────────────
export default function ChannelSettingsPage() {
  const { tg } = useTelegram();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState<ChannelTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple-mode state (WYSIWYG card editor)
  const [prefix, setPrefix] = useState('');
  const [blocks, setBlocks] = useState<BlockState[]>(DEFAULT_BLOCKS);
  const [editingBlock, setEditingBlock] = useState<BlockKey | null>(null);
  const [dragKey, setDragKey] = useState<BlockKey | null>(null);

  // Legacy banner (показывается, если parseTemplate вернул null)
  const [legacyBannerActive, setLegacyBannerActive] = useState(false);
  const legacyOriginalHtmlRef = useRef<string | null>(null);

  // Advanced-mode (collapsed disclosure внизу)
  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedDisclosureOpen, setAdvancedDisclosureOpen] = useState(false);
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

  // Channel bind/unbind
  const [channelInput, setChannelInput] = useState('');
  const [bindingChannel, setBindingChannel] = useState(false);

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

  // ─── Derived sections from blocks ────────────────────────────────────────
  // composeTemplate использует sections-объект, мы держим его в sync с blocks.
  const sections: Record<SectionKey, boolean> = useMemo(() => {
    const out: Record<SectionKey, boolean> = { ...DEFAULT_SECTIONS };
    for (const k of SECTION_KEYS) {
      const block = blocks.find((b) => b.key === k);
      out[k] = block?.visible ?? DEFAULT_SECTIONS[k];
    }
    // Если prefix-блок невидим — обнуляем prefix в шаблоне.
    return out;
  }, [blocks]);

  const prefixVisible = useMemo(
    () => blocks.find((b) => b.key === 'prefix')?.visible ?? false,
    [blocks],
  );

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

        const parsed = parseTemplate(d.channelPostTemplate);
        if (parsed) {
          // Свежий v2/v3-шаблон — заполняем simple-state.
          applyParsedToBlocks(parsed);
          setAdvancedMode(false);
          setLegacyBannerActive(false);
          setAdvancedTemplate(d.channelPostTemplate ?? d.defaultTemplate);
        } else {
          // Legacy / ручной HTML.
          // НЕ переключаем в advanced автоматически. Banner + defaults.
          legacyOriginalHtmlRef.current = d.channelPostTemplate ?? null;
          setLegacyBannerActive(true);
          setBlocks(DEFAULT_BLOCKS);
          setPrefix('');
          setAdvancedMode(false);
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

  function applyParsedToBlocks(parsed: SimpleConfig) {
    setPrefix(parsed.prefix);
    setBlocks((prev) => {
      // Сохраняем порядок прежний (или DEFAULT) — просто меняем visible.
      const base = prev.length === DEFAULT_BLOCKS.length ? prev : DEFAULT_BLOCKS;
      return base.map((b) => {
        if (b.key === 'prefix') return { ...b, visible: parsed.prefix.length > 0 };
        if (b.key === 'photo') return { ...b, visible: parsed.sections.photo };
        if (b.key === 'contacts') return { ...b, visible: true };
        if (b.key === 'title') return { ...b, visible: parsed.sections.title };
        if (b.key === 'price') return { ...b, visible: parsed.sections.price };
        if (b.key === 'description') return { ...b, visible: parsed.sections.description };
        if (b.key === 'buyButton') return { ...b, visible: parsed.sections.buyButton };
        return b;
      });
    });
  }

  // ─── Compose current template ────────────────────────────────────────────
  const currentTemplate = useMemo(() => {
    if (advancedMode) return advancedTemplate;
    // Если legacy banner всё ещё активен — пользователь его не разрулил —
    // НЕ перезаписываем originalHtml на сервере. Возвращаем то, что было.
    if (legacyBannerActive && legacyOriginalHtmlRef.current !== null) {
      return legacyOriginalHtmlRef.current;
    }
    return composeTemplate({
      prefix: prefixVisible ? prefix : '',
      sections,
    });
  }, [advancedMode, advancedTemplate, prefix, prefixVisible, sections, legacyBannerActive]);

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

    // Sanity-check: если simple-mode — убедимся, что compose выдаёт parseable.
    if (!advancedMode && !legacyBannerActive) {
      const sanityParsed = parseTemplate(currentTemplate);
      if (!sanityParsed) {
        showToast(t('seller.channel.dev.parseFailed'), 'error');
        return;
      }
    }

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
  }, [data, saving, advancedMode, legacyBannerActive, currentTemplate, contactPhone, instagram, tiktok, tg, t]);

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

  // ─── Channel bind / unbind ───────────────────────────────────────────────
  const bindChannel = useCallback(async () => {
    const id = channelInput.trim();
    if (!id || bindingChannel) return;
    setBindingChannel(true);
    try {
      const res = await api<{ telegramChannelId: string; telegramChannelTitle: string; autoPostProductsToChannel: boolean }>(
        '/seller/store/channel',
        { method: 'PATCH', body: { channelId: id.startsWith('@') ? id : `@${id}` }, noCache: true },
      );
      bustCache('/seller/store/channel-template');
      setData((prev) => prev ? { ...prev, telegramChannelId: res.telegramChannelId, telegramChannelTitle: res.telegramChannelTitle, autoPostProductsToChannel: res.autoPostProductsToChannel } : prev);
      setAutoPost(res.autoPostProductsToChannel);
      setChannelInput('');
      tg?.HapticFeedback.notificationOccurred('success');
      showToast(`✅ Канал ${res.telegramChannelTitle ?? res.telegramChannelId} привязан!`);
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : 'Ошибка привязки';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setBindingChannel(false);
    }
  }, [channelInput, bindingChannel, tg]);

  const unbindChannel = useCallback(async () => {
    if (bindingChannel) return;
    setBindingChannel(true);
    try {
      await api('/seller/store/channel', { method: 'PATCH', body: { channelId: null }, noCache: true });
      bustCache('/seller/store/channel-template');
      setData((prev) => prev ? { ...prev, telegramChannelId: null, telegramChannelTitle: null, autoPostProductsToChannel: false } : prev);
      setAutoPost(false);
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('Канал отвязан');
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : 'Ошибка';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setBindingChannel(false);
    }
  }, [bindingChannel, tg]);

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

  // ─── Block visibility / reorder / edit ───────────────────────────────────
  const setBlockVisible = useCallback((key: BlockKey, visible: boolean) => {
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, visible } : b)));
    tg?.HapticFeedback.selectionChanged();
  }, [tg]);

  const moveBlock = useCallback((from: BlockKey, to: BlockKey) => {
    if (from === to) return;
    setBlocks((prev) => {
      const fromIdx = prev.findIndex((b) => b.key === from);
      const toIdx = prev.findIndex((b) => b.key === to);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = prev.slice();
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    tg?.HapticFeedback.impactOccurred?.('light');
  }, [tg]);

  // ─── Legacy banner actions ──────────────────────────────────────────────
  const acceptLegacyReset = useCallback(() => {
    if (!confirm(t('seller.channel.legacy.banner.confirm'))) return;
    // Сбрасываем к DEFAULT, помечаем dirty — теперь currentTemplate
    // композится из blocks, а не из legacyOriginalHtmlRef.
    legacyOriginalHtmlRef.current = null;
    setLegacyBannerActive(false);
    setBlocks(DEFAULT_BLOCKS);
    setPrefix('');
    tg?.HapticFeedback.notificationOccurred('warning');
  }, [t, tg]);

  const legacyKeepHtml = useCallback(() => {
    // Открываем advanced disclosure и перенаправляем фокус.
    setAdvancedDisclosureOpen(true);
    setAdvancedMode(true);
    setLegacyBannerActive(false);
    // advancedTemplate уже содержит legacy HTML (выставлен при load).
    tg?.HapticFeedback.selectionChanged();
    // scroll to bottom — disclosure уже виден.
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, [tg]);

  // ─── Switch advanced/simple from dev disclosure ─────────────────────────
  const switchToSimple = useCallback(() => {
    const parsed = parseTemplate(advancedTemplate);
    if (!parsed) {
      if (!confirm(t('seller.channel.dev.parseFailed'))) return;
      setBlocks(DEFAULT_BLOCKS);
      setPrefix('');
    } else {
      applyParsedToBlocks(parsed);
    }
    setAdvancedMode(false);
    tg?.HapticFeedback.selectionChanged();
  }, [advancedTemplate, t, tg]);

  const openAdvancedFromDisclosure = useCallback(() => {
    if (!confirm(t('seller.channel.dev.warning'))) return;
    // Скомпилируем текущий simple → advanced как стартовая точка
    if (!advancedMode) {
      setAdvancedTemplate(
        composeTemplate({ prefix: prefixVisible ? prefix : '', sections }),
      );
    }
    setAdvancedMode(true);
    setAdvancedDisclosureOpen(true);
    tg?.HapticFeedback.selectionChanged();
  }, [advancedMode, prefix, prefixVisible, sections, t, tg]);

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-md md:max-w-3xl mx-auto w-full">
        <Skeleton style={{ height: 24, width: '50%' }} />
        <Skeleton style={{ height: 80 }} />
        <Skeleton style={{ height: 320 }} />
        <Skeleton style={{ height: 140 }} />
      </div>
    );
  }

  const channelAttached = !!data?.telegramChannelId;
  const channelUsername = data?.telegramChannelId
    ? (data.telegramChannelId.startsWith('@') ? data.telegramChannelId : `@${data.telegramChannelId.replace(/^-100\d+$/, data.telegramChannelTitle ?? '')}`)
    : '';

  return (
    <div className="flex flex-col gap-4 max-w-md md:max-w-3xl mx-auto w-full pb-24">
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

      {/* ── 2. Канал ── */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
          {t('seller.channel.binding.header')}
        </p>
        {channelAttached ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
                {t('seller.channel.binding.channelLabel')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={data?.telegramChannelTitle ?? channelUsername}
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none min-w-0"
                  style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
                />
                <span style={{ color: 'var(--tg-success)', fontSize: 18 }}>✓</span>
              </div>
            </div>
            <button
              onClick={unbindChannel}
              disabled={bindingChannel}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: 'rgba(248,113,113,0.10)',
                color: 'var(--tg-danger)',
                border: '1px solid rgba(248,113,113,0.25)',
                opacity: bindingChannel ? 0.5 : 1,
              }}
            >
              {bindingChannel ? 'Отвязываем...' : 'Отвязать канал'}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
              Добавьте <b style={{ color: 'var(--tg-text-secondary)' }}>@savdo_builderBOT</b> как администратора в ваш канал, затем введите @username канала:
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="@mychannel"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none min-w-0"
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter') void bindChannel(); }}
                  disabled={bindingChannel}
                />
                <button
                  onClick={bindChannel}
                  disabled={bindingChannel || !channelInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
                  style={{
                    background: bindingChannel || !channelInput.trim()
                      ? 'var(--tg-surface)'
                      : `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`,
                    color: bindingChannel || !channelInput.trim() ? 'var(--tg-text-dim)' : '#fff',
                  }}
                >
                  {bindingChannel ? '...' : 'Привязать'}
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {/* ── 3. Legacy banner (если parseTemplate → null) ── */}
      {legacyBannerActive && (
        <LegacyTemplateBanner
          onReset={acceptLegacyReset}
          onKeep={legacyKeepHtml}
          t={t}
        />
      )}

      {/* ── 4. WYSIWYG card editor — основной UI ── */}
      {!advancedMode && (
        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xxs font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
              {t('seller.channel.editor.header')}
            </p>
            <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
              {t('seller.channel.editor.hint')}
            </p>
            {previewLoading && (
              <span className="text-xxs mt-1" style={{ color: 'var(--tg-text-muted)' }}>
                {t('seller.channel.preview.loading')}
              </span>
            )}
          </div>

          <WysiwygPostEditor
            blocks={blocks}
            prefixText={prefix}
            sample={preview}
            contactPhone={contactPhone}
            instagram={instagram}
            tiktok={tiktok}
            dragKey={dragKey}
            onDragStart={(k) => setDragKey(k)}
            onDragEnd={() => setDragKey(null)}
            onDropOn={(target) => {
              if (dragKey && dragKey !== target) moveBlock(dragKey, target);
              setDragKey(null);
            }}
            onTapBlock={(k) => setEditingBlock(k)}
            t={t}
          />

          {preview?.sampleProductTitle && (
            <p className="text-xxs" style={{ color: 'var(--tg-text-dim)' }}>
              {t('seller.channel.preview.sampleNote', { title: preview.sampleProductTitle })}
            </p>
          )}
        </GlassCard>
      )}

      {/* ── 5. Контакты ── */}
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

      {/* ── 6. Тестовый пост ── */}
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

      {/* ── 7. Dev disclosure (advanced HTML) — collapsed внизу ── */}
      {DEV_HTML_ENABLED && (
        <DevDisclosure
          open={advancedDisclosureOpen}
          onToggle={() => {
            if (!advancedDisclosureOpen) {
              // первое раскрытие — без confirm, просто показываем callout
              setAdvancedDisclosureOpen(true);
            } else {
              setAdvancedDisclosureOpen(false);
            }
          }}
          advancedMode={advancedMode}
          advancedTemplate={advancedTemplate}
          onAdvancedTemplateChange={setAdvancedTemplate}
          onOpenAdvanced={openAdvancedFromDisclosure}
          onBackToSimple={switchToSimple}
          defaultTemplate={data?.defaultTemplate}
          t={t}
        />
      )}

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

      {/* ── Popover для редактирования блока ── */}
      {editingBlock && (
        <InlineEditPopover
          blockKey={editingBlock}
          visible={blocks.find((b) => b.key === editingBlock)?.visible ?? true}
          prefix={prefix}
          onPrefixChange={setPrefix}
          onSetVisible={(v) => setBlockVisible(editingBlock, v)}
          onClose={() => setEditingBlock(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Legacy banner ─────────────────────────────────────────────────────────
function LegacyTemplateBanner({
  onReset, onKeep, t,
}: {
  onReset: () => void;
  onKeep: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <GlassCard
      className="p-4 flex flex-col gap-2"
      style={{ border: '1px solid #FBBF24', background: 'rgba(251,191,36,0.08)' }}
    >
      <p className="text-sm font-semibold" style={{ color: '#FBBF24' }}>
        ⚠️ {t('seller.channel.legacy.banner.title')}
      </p>
      <p className="text-xs" style={{ color: 'var(--tg-text-secondary)' }}>
        {t('seller.channel.legacy.banner.desc')}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mt-1">
        <button
          onClick={onReset}
          className="flex-1 py-2 rounded-xl text-xs font-semibold"
          style={{ background: `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`, color: '#fff' }}
        >
          {t('seller.channel.legacy.banner.reset')}
        </button>
        <button
          onClick={onKeep}
          className="flex-1 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--tg-surface)', color: 'var(--tg-text-primary)', border: '1px solid var(--tg-border)' }}
        >
          {t('seller.channel.legacy.banner.keep')}
        </button>
      </div>
    </GlassCard>
  );
}

// ─── Wysiwyg post editor (TG mock card as the editor) ─────────────────────
function WysiwygPostEditor({
  blocks, prefixText, sample, contactPhone, instagram, tiktok,
  dragKey, onDragStart, onDragEnd, onDropOn, onTapBlock, t,
}: {
  blocks: BlockState[];
  prefixText: string;
  sample: PreviewResult | null;
  contactPhone: string;
  instagram: string;
  tiktok: string;
  dragKey: BlockKey | null;
  onDragStart: (k: BlockKey) => void;
  onDragEnd: () => void;
  onDropOn: (target: BlockKey) => void;
  onTapBlock: (k: BlockKey) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  // Распакуем sample.caption HTML в куски для отдельных блоков —
  // sample caption уже отрендерен бэком на основе текущего currentTemplate,
  // но для визуальной чистоты редактора (каждый блок — отдельная карточка)
  // мы показываем sampleProductTitle отдельно, а описание/цену берём из
  // caption как fallback. Это OK — sample отражает реальный продукт.
  const sampleTitle = sample?.sampleProductTitle ?? 'Mahsulot nomi';

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--tg-surface)',
        border: '1px solid var(--tg-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {blocks.map((b) => (
        <BlockSlot
          key={b.key}
          block={b}
          isDragging={dragKey === b.key}
          isDropTarget={dragKey !== null && dragKey !== b.key}
          onDragStart={() => onDragStart(b.key)}
          onDragEnd={onDragEnd}
          onDropOn={() => onDropOn(b.key)}
          onTap={() => onTapBlock(b.key)}
          t={t}
        >
          {renderBlockContent(b.key, {
            prefixText,
            sampleTitle,
            contactPhone,
            instagram,
            tiktok,
            t,
          })}
        </BlockSlot>
      ))}
    </div>
  );
}

function renderBlockContent(
  key: BlockKey,
  ctx: {
    prefixText: string;
    sampleTitle: string;
    contactPhone: string;
    instagram: string;
    tiktok: string;
    t: (k: string, p?: Record<string, string | number>) => string;
  },
): React.ReactNode {
  switch (key) {
    case 'prefix':
      return ctx.prefixText.trim() ? (
        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--tg-text-primary)', lineHeight: 1.45 }}>
          {ctx.prefixText}
        </p>
      ) : (
        <p className="text-sm italic" style={{ color: 'var(--tg-text-muted)' }}>
          {ctx.t('seller.channel.block.prefix.empty')}
        </p>
      );
    case 'photo':
      return (
        <div
          className="w-full flex items-center justify-center rounded-lg"
          style={{
            aspectRatio: '4 / 3',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.25))',
            color: 'var(--tg-text-muted)',
            fontSize: 14,
          }}
        >
          <span style={{ opacity: 0.7 }}>📷 {ctx.t('seller.channel.block.photo.label')}</span>
        </div>
      );
    case 'title':
      return (
        <p className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>
          {ctx.sampleTitle}
        </p>
      );
    case 'price':
      return (
        <p className="text-sm" style={{ color: 'var(--tg-text-primary)' }}>
          💰 <span className="font-semibold">599 000 UZS</span>{' '}
          <s style={{ color: 'var(--tg-text-muted)' }}>750 000 UZS</s>
        </p>
      );
    case 'description':
      return (
        <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--tg-text-secondary)', lineHeight: 1.5 }}>
          {ctx.t('seller.channel.block.description.fromProduct')}
        </p>
      );
    case 'contacts': {
      const rows: string[] = [];
      if (ctx.contactPhone) rows.push(`📞 ${ctx.contactPhone}`);
      if (ctx.instagram) rows.push(`📷 ${ctx.instagram}`);
      if (ctx.tiktok) rows.push(`🎵 ${ctx.tiktok}`);
      return rows.length ? (
        <div className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <p key={i} className="text-xs" style={{ color: 'var(--tg-text-secondary)' }}>{r}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs italic" style={{ color: 'var(--tg-text-muted)' }}>
          {ctx.t('seller.channel.block.contacts.hint')}
        </p>
      );
    }
    case 'buyButton':
      return (
        <div
          className="w-full text-center py-2 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(168,85,247,0.10)',
            color: ACCENT,
            border: '1px solid rgba(168,85,247,0.25)',
          }}
        >
          {ctx.t('seller.channel.preview.buyBtn')}
        </div>
      );
    default:
      return null;
  }
}

// ─── Block slot (one row in the card) ──────────────────────────────────────
function BlockSlot({
  block, children, isDragging, isDropTarget,
  onDragStart, onDragEnd, onDropOn, onTap, t,
}: {
  block: BlockState;
  children: React.ReactNode;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
  onTap: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  if (!block.visible) {
    // Hidden block placeholder — компактная строка «нажмите чтобы добавить»
    return (
      <button
        type="button"
        onClick={onTap}
        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
        style={{
          color: 'var(--tg-text-muted)',
          background: 'transparent',
          borderTop: '1px dashed var(--tg-border)',
          borderBottom: '1px dashed var(--tg-border)',
          opacity: 0.6,
          minHeight: 44,
        }}
        aria-label={t('seller.channel.block.show')}
      >
        <span aria-hidden>＋</span>
        <span>{labelFor(block.key, t)}</span>
        <span className="ml-auto" aria-hidden>👁</span>
      </button>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', block.key);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => { e.preventDefault(); onDropOn(); }}
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); }
      }}
      aria-label={`${labelFor(block.key, t)} — ${t('seller.channel.empty.tapToEdit')}`}
      className="w-full px-3 py-3 flex items-start gap-2 cursor-pointer transition-colors"
      style={{
        background: isDragging
          ? 'rgba(168,85,247,0.12)'
          : isDropTarget
            ? 'rgba(168,85,247,0.04)'
            : 'transparent',
        borderTop: '1px solid var(--tg-border)',
        opacity: isDragging ? 0.6 : 1,
        minHeight: 48,
      }}
    >
      {/* drag handle */}
      <span
        aria-hidden
        className="select-none flex items-center justify-center"
        style={{
          width: 18, height: 18, marginTop: 2,
          color: 'var(--tg-text-dim)', fontSize: 16, lineHeight: 1, cursor: 'grab', flexShrink: 0,
        }}
        title={t('seller.channel.block.dragHint')}
      >
        ⋮⋮
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xxs uppercase tracking-wider font-semibold" style={{ color: 'var(--tg-text-dim)' }}>
            {labelFor(block.key, t)}
          </span>
          <span
            aria-hidden
            style={{ color: 'var(--tg-text-muted)', fontSize: 14 }}
          >
            👁
          </span>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function labelFor(key: BlockKey, t: (k: string) => string): string {
  switch (key) {
    case 'prefix': return t('seller.channel.block.prefix.label');
    case 'title': return t('seller.channel.block.title.label');
    case 'photo': return t('seller.channel.block.photo.label');
    case 'price': return t('seller.channel.block.price.label');
    case 'description': return t('seller.channel.block.description.label');
    case 'contacts': return t('seller.channel.block.contacts.label');
    case 'buyButton': return t('seller.channel.block.buyButton.label');
  }
}

// ─── Inline edit popover (modal-ish bottom-sheet) ─────────────────────────
function InlineEditPopover({
  blockKey, visible, prefix, onPrefixChange, onSetVisible, onClose, t,
}: {
  blockKey: BlockKey;
  visible: boolean;
  prefix: string;
  onPrefixChange: (v: string) => void;
  onSetVisible: (v: boolean) => void;
  onClose: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const [localPrefix, setLocalPrefix] = useState(prefix);
  const [localVisible, setLocalVisible] = useState(visible);

  useEffect(() => { setLocalPrefix(prefix); }, [prefix]);
  useEffect(() => { setLocalVisible(visible); }, [visible]);

  const isPrefix = blockKey === 'prefix';
  const hintKey = ({
    title: 'seller.channel.block.title.fromProduct',
    price: 'seller.channel.block.price.fromProduct',
    description: 'seller.channel.block.description.fromProduct',
    photo: 'seller.channel.block.photo.hint',
    contacts: 'seller.channel.block.contacts.hint',
    buyButton: 'seller.channel.block.buyButton.hint',
    prefix: 'seller.channel.block.prefix.hint',
  } as Record<BlockKey, string>)[blockKey];

  const save = () => {
    onSetVisible(isPrefix ? localPrefix.trim().length > 0 : localVisible);
    if (isPrefix) onPrefixChange(localPrefix);
    onClose();
  };

  const cancel = () => onClose();

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={cancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md flex flex-col gap-3 p-4"
        style={{
          background: 'var(--tg-bg)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          borderTop: '1px solid var(--tg-border)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        {/* Drag handle */}
        <div
          aria-hidden
          style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'var(--tg-border)', alignSelf: 'center',
          }}
        />

        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>
            {labelFor(blockKey, t)}
          </h3>
          <button
            onClick={cancel}
            aria-label={t('seller.channel.popover.cancel')}
            className="text-sm w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: 'var(--tg-text-muted)', background: 'var(--tg-surface)' }}
          >
            ✕
          </button>
        </div>

        <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
          {t(hintKey)}
        </p>

        {isPrefix && (
          <>
            <textarea
              value={localPrefix}
              onChange={(e) => setLocalPrefix(e.target.value)}
              rows={3}
              spellCheck={true}
              maxLength={300}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              placeholder={t('seller.channel.block.prefix.placeholder')}
            />
            <p className="text-xxs text-right" style={{ color: 'var(--tg-text-muted)' }}>
              {t('seller.channel.popover.charCount', { n: localPrefix.length, max: 300 })}
            </p>
          </>
        )}

        {!isPrefix && (
          <button
            onClick={() => setLocalVisible((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl"
            style={{ background: 'var(--tg-surface)', border: '1px solid var(--tg-border)', minHeight: 48 }}
          >
            <span className="text-sm" style={{ color: 'var(--tg-text-primary)' }}>
              {t('seller.channel.popover.showInPost')}
            </span>
            <Toggle on={localVisible} onChange={() => setLocalVisible((v) => !v)} />
          </button>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={cancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--tg-surface)', color: 'var(--tg-text-primary)', border: '1px solid var(--tg-border)' }}
          >
            {t('seller.channel.popover.cancel')}
          </button>
          <button
            onClick={save}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`, color: '#fff' }}
          >
            {isPrefix ? t('seller.channel.popover.save') : t('seller.channel.popover.done')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dev disclosure (advanced HTML escape hatch) ───────────────────────────
function DevDisclosure({
  open, onToggle, advancedMode, advancedTemplate, onAdvancedTemplateChange,
  onOpenAdvanced, onBackToSimple, defaultTemplate, t,
}: {
  open: boolean;
  onToggle: () => void;
  advancedMode: boolean;
  advancedTemplate: string;
  onAdvancedTemplateChange: (v: string) => void;
  onOpenAdvanced: () => void;
  onBackToSimple: () => void;
  defaultTemplate?: string;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <GlassCard className="p-4 flex flex-col gap-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', minHeight: 32 }}
      >
        <span className="text-xxs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--tg-text-dim)' }}>
          <span aria-hidden>&lt;/&gt;</span>
          {t('seller.channel.dev.toggle')}
        </span>
        <span aria-hidden style={{ color: 'var(--tg-text-dim)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>⌄</span>
      </button>

      {open && (
        <>
          {!advancedMode ? (
            <>
              <p className="text-xs" style={{ color: 'var(--tg-text-muted)' }}>
                {t('seller.channel.dev.warning')}
              </p>
              <button
                onClick={onOpenAdvanced}
                className="text-xs px-3 py-2 rounded-lg font-semibold"
                style={{ color: ACCENT, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)' }}
              >
                {t('seller.channel.dev.openConfirm')}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs" style={{ color: '#FBBF24' }}>
                  {t('seller.channel.advanced.warn')}
                </p>
                <button
                  onClick={onBackToSimple}
                  className="text-xxs px-2 py-1 rounded-lg"
                  style={{ color: ACCENT, background: 'rgba(168,85,247,0.10)' }}
                >
                  {t('seller.channel.dev.backToSimple')}
                </button>
              </div>
              <textarea
                value={advancedTemplate}
                onChange={(e) => onAdvancedTemplateChange(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 220 }}
                placeholder={defaultTemplate}
              />
            </>
          )}
        </>
      )}
    </GlassCard>
  );
}
