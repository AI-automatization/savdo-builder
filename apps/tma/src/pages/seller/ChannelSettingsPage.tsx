import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, bustCache } from '@/lib/api';
import { useMainButton } from '@/lib/useMainButton';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001 (TMA UI):
 *
 * Страница `/seller/settings/channel` — продавец настраивает как наш бот
 * постит товары в его TG-канал:
 *   • toggle авто-постинга
 *   • контакты (телефон / IG / TikTok) для подстановки в шаблон
 *   • редактор шаблона с insert-variable чипами
 *   • live preview через POST /channel-template/preview (debounced)
 *   • кнопка тестового поста — отправит реальный последний ACTIVE-товар
 */

const TEMPLATE_VARIABLES: Array<{ key: string; label: string; hint: string }> = [
  { key: 'title',        label: '{{title}}',        hint: 'Название товара' },
  { key: 'price',        label: '{{price}}',        hint: 'Цена (форматированная)' },
  { key: 'oldPrice',     label: '{{oldPrice}}',     hint: 'Старая цена (для скидки)' },
  { key: 'hasOldPrice',  label: '{{#hasOldPrice}}', hint: 'Секция: есть ли скидка' },
  { key: 'description',  label: '{{description}}',  hint: 'Описание товара' },
  { key: 'material',     label: '{{material}}',     hint: 'Материал (из атрибутов)' },
  { key: 'sizes',        label: '{{sizes}}',        hint: 'Размеры (из вариантов)' },
  { key: 'availability', label: '{{availability}}', hint: '«В наличии» / «Под заказ»' },
  { key: 'contact',      label: '{{contact}}',      hint: 'Телефон или TG-контакт' },
  { key: 'instagram',    label: '{{instagram}}',    hint: 'Ссылка на Instagram' },
  { key: 'tiktok',       label: '{{tiktok}}',       hint: 'Ссылка на TikTok' },
  { key: 'storeName',    label: '{{storeName}}',    hint: 'Название магазина' },
  { key: 'productUrl',   label: '{{productUrl}}',   hint: 'Ссылка на товар' },
];

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

const ACCENT = '#A855F7';
const ACCENT_DARK = '#7C3AED';

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? ACCENT : 'rgba(255,255,255,0.15)',
        border: 'none', cursor: disabled ? 'wait' : 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
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
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'rgba(255,255,255,0.90)',
};

export default function ChannelSettingsPage() {
  const { tg } = useTelegram();
  const navigate = useNavigate();

  const [data, setData] = useState<ChannelTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [template, setTemplate] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [autoPost, setAutoPost] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [togglingAutoPost, setTogglingAutoPost] = useState(false);

  // Preview state
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);

  // ─── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadAbortRef.current?.abort();
    const ac = new AbortController();
    loadAbortRef.current = ac;
    api<ChannelTemplate>('/seller/store/channel-template', { signal: ac.signal, forceFresh: true })
      .then((d) => {
        if (ac.signal.aborted) return;
        setData(d);
        setTemplate(d.channelPostTemplate ?? '');
        setContactPhone(d.channelContactPhone ?? '');
        setInstagram(d.channelInstagramLink ?? '');
        setTiktok(d.channelTiktokLink ?? '');
        setAutoPost(d.autoPostProductsToChannel);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        showToast('Не удалось загрузить настройки канала', 'error');
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, []);

  // ─── Live preview (debounced) ──────────────────────────────────────────────
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
        body: { template: template || undefined },
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
  }, [template, contactPhone, instagram, tiktok, data]);

  // ─── Dirty detection ────────────────────────────────────────────────────────
  const dirty =
    !!data &&
    (
      (template || null) !== data.channelPostTemplate ||
      (contactPhone || null) !== data.channelContactPhone ||
      (instagram || null) !== data.channelInstagramLink ||
      (tiktok || null) !== data.channelTiktokLink
    );

  // ─── Save ───────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!data || saving) return;
    setSaving(true);
    try {
      await api('/seller/store/channel-template', {
        method: 'PATCH',
        body: {
          channelPostTemplate: template,
          channelContactPhone: contactPhone,
          channelInstagramLink: instagram,
          channelTiktokLink: tiktok,
        },
      });
      bustCache('/seller/store/channel-template');
      setData((prev) => prev && {
        ...prev,
        channelPostTemplate: template || null,
        channelContactPhone: contactPhone || null,
        channelInstagramLink: instagram || null,
        channelTiktokLink: tiktok || null,
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Настройки канала сохранены');
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [data, saving, template, contactPhone, instagram, tiktok, tg]);

  useMainButton({
    text: saving ? 'Сохранение…' : 'Сохранить',
    onClick: save,
    visible: !loading && dirty,
    enabled: !saving,
    loading: saving,
  });

  // ─── Auto-post toggle ───────────────────────────────────────────────────────
  const toggleAutoPost = useCallback(async () => {
    if (!data || togglingAutoPost) return;
    if (!data.telegramChannelId) {
      showToast('Сначала привяжите канал через @savdo_builderBOT → /start', 'error');
      return;
    }
    const next = !autoPost;
    setTogglingAutoPost(true);
    setAutoPost(next);
    try {
      await api('/seller/store', { method: 'PATCH', body: { autoPostProductsToChannel: next } });
      tg?.HapticFeedback.selectionChanged();
      showToast(next ? '✅ Авто-постинг включён' : '⏸ Авто-постинг выключен');
    } catch {
      setAutoPost(!next);
      showToast('❌ Не удалось переключить', 'error');
    } finally {
      setTogglingAutoPost(false);
    }
  }, [data, autoPost, togglingAutoPost, tg]);

  // ─── Test post ──────────────────────────────────────────────────────────────
  const sendTestPost = useCallback(async () => {
    if (testing) return;
    if (dirty) {
      showToast('Сначала сохраните изменения шаблона', 'error');
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
        showToast('✅ Тестовый пост отправлен в канал');
      } else {
        tg?.HapticFeedback.notificationOccurred('warning');
        showToast(`⚠️ Не отправлен: ${res.reason ?? 'unknown'}`, 'error');
      }
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : 'Ошибка';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setTesting(false);
    }
  }, [testing, dirty, tg]);

  // ─── Insert variable into textarea at cursor ────────────────────────────────
  const insertVariable = (label: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setTemplate((t) => t + label);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const inserted = label.startsWith('{{#')
      ? `${label}…{{/${label.slice(3, -2)}}}`
      : label;
    setTemplate((prev) => prev.slice(0, start) + inserted + prev.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + inserted.length;
      ta.setSelectionRange(pos, pos);
    });
    tg?.HapticFeedback.selectionChanged();
  };

  const resetToDefault = () => {
    if (!data) return;
    if (!confirm('Сбросить шаблон к стандартному?')) return;
    setTemplate(data.defaultTemplate);
    tg?.HapticFeedback.selectionChanged();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
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

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}
        >
          ← Назад
        </button>
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Telegram канал
        </h1>
      </div>

      {/* ── Канал привязан? ── */}
      <GlassCard className="p-4 flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Привязка канала
        </p>
        {channelAttached ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>
                ✅ {data?.telegramChannelTitle ?? data?.telegramChannelId}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {data?.telegramChannelId}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Канал ещё не привязан.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Откройте чат с <b>@savdo_builderBOT</b> → команда <code>/start</code> → «Привязать канал».
              Боту нужны права администратора в вашем канале.
            </p>
          </div>
        )}
      </GlassCard>

      {/* ── Авто-постинг ── */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Авто-постинг
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Публиковать товары автоматически
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
              При публикации товара бот сам отправит его в ваш канал с фото и кнопкой «Открыть».
            </p>
          </div>
          <Toggle
            on={autoPost && channelAttached}
            onChange={toggleAutoPost}
            disabled={togglingAutoPost || !channelAttached}
          />
        </div>
      </GlassCard>

      {/* ── Контакты для шаблона ── */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Контакты в посте
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Подставляются в шаблон через <code>{'{{contact}}'}</code>, <code>{'{{instagram}}'}</code>, <code>{'{{tiktok}}'}</code>.
          Если пусто — используется ваша основная ссылка из TG-контакта.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Телефон для заказов
          </label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+998 77 065 54 35"
            inputMode="tel"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Instagram (https://…)
          </label>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/your_brand"
            inputMode="url"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            TikTok (https://…)
          </label>
          <input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@your_brand"
            inputMode="url"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </GlassCard>

      {/* ── Шаблон поста ── */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Шаблон поста
          </p>
          <button
            onClick={resetToDefault}
            className="text-[11px] px-2 py-1 rounded-lg"
            style={{ color: ACCENT, background: 'rgba(168,85,247,0.10)' }}
          >
            Сбросить
          </button>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Поддерживается HTML (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;a&gt;</code>),
          переменные <code>{'{{var}}'}</code> и секции <code>{'{{#var}}…{{/var}}'}</code>.
        </p>

        <textarea
          ref={textareaRef}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 220 }}
          placeholder={data?.defaultTemplate}
        />

        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.label)}
              title={v.hint}
              className="text-[11px] px-2 py-1 rounded-lg font-mono"
              style={{
                background: 'rgba(168,85,247,0.10)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: ACCENT,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Preview ── */}
      <GlassCard className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Превью
          </p>
          {previewLoading && (
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              рендерим…
            </span>
          )}
        </div>
        {preview ? (
          <>
            <div
              className="text-sm whitespace-pre-wrap"
              style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: preview.caption }}
            />
            {preview.sampleProductTitle && (
              <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Образец на товаре: {preview.sampleProductTitle}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Превью появится здесь автоматически.
          </p>
        )}
      </GlassCard>

      {/* ── Тестовый пост ── */}
      <GlassCard className="p-4 flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Тестовая публикация
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Отправит ваш самый свежий опубликованный товар в канал по текущему сохранённому шаблону.
        </p>
        <button
          onClick={sendTestPost}
          disabled={testing || !channelAttached || dirty}
          className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1"
          style={{
            background: testing || !channelAttached || dirty
              ? 'rgba(255,255,255,0.06)'
              : `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`,
            color: testing || !channelAttached || dirty ? 'rgba(255,255,255,0.30)' : '#fff',
            transition: 'all 0.15s',
          }}
        >
          {testing ? 'Отправляем…' : '📨 Отправить тестовый пост'}
        </button>
        {dirty && (
          <p className="text-[11px]" style={{ color: '#FBBF24' }}>
            ⚠️ Есть несохранённые изменения — сохраните перед тестом.
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
            background: saving || !dirty ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT})`,
            color: saving || !dirty ? 'rgba(255,255,255,0.30)' : '#fff',
          }}
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      )}
    </div>
  );
}
