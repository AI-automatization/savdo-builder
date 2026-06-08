import { useEffect, useRef } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';

interface UseMainButtonOptions {
  text: string;
  onClick: () => void;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
}

interface AppliedPayload {
  text: string;
  visible: boolean;
  enabled: boolean;
  loading: boolean;
}

/**
 * TMA-SELLER-MAIN-BUTTON-001 (12.05.2026): обёртка над `tg.MainButton`.
 *
 * Telegram WebApp выдаёт фиксированный CTA внизу экрана. На длинных
 * формах (AddProduct, EditProduct, seller/Settings) обычный submit-button
 * теряется под скроллом — пользователь должен прокручивать до конца
 * чтобы найти его. MainButton всегда видим.
 *
 * Использование:
 *   const onSave = useCallback(() => save(), [...]);
 *   useMainButton({
 *     text: saving ? 'Сохранение...' : 'Сохранить',
 *     onClick: onSave,
 *     enabled: !saving && isValid,
 *     loading: saving,
 *   });
 *
 * TMA-SELLER-MAIN-BUTTON-002 (08.06.2026): фикс spam'а
 * `web_app_setup_main_button` при `viewport_changed`. Причина: каждый
 * setState в TelegramProvider создавал новый context value, что
 * приводило к ре-рендеру всех потребителей `useTelegram()`. Если
 * вызывающий компонент передавал inline-onClick (без useCallback),
 * useEffect перезапускался и снова дёргал setText/show/enable/etc — и
 * каждый из этих вызовов транслировался в postEvent в Telegram WebView.
 *
 * Решение:
 *  - onClick храним в ref и биндим один раз, чтобы он НЕ участвовал
 *    в deps основного эффекта (binding локальный, postEvent не идёт);
 *  - последний применённый payload (text/visible/enabled/loading)
 *    кешируем в ref и вызываем setText/show/enable/showProgress
 *    ТОЛЬКО при реальном изменении значений (idempotency на уровне
 *    postEvent).
 *
 * `onClick` теперь можно передавать без useCallback — стабильность не
 * требуется. Это убирает целый класс багов в формах.
 */
export function useMainButton(opts: UseMainButtonOptions): void {
  const { tg } = useTelegram();
  const { text, onClick, visible = true, enabled = true, loading = false } = opts;

  // Храним актуальный onClick в ref, чтобы стабильный wrapper, прибитый
  // к MainButton, всегда вызывал свежее замыкание из вызывающего компонента.
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // Последний применённый к Telegram payload. Используется для shallow-equal
  // сравнения перед каждым postEvent.
  const appliedRef = useRef<AppliedPayload | null>(null);

  useEffect(() => {
    if (!tg) return;

    const stableClick = () => onClickRef.current();
    tg.MainButton.onClick(stableClick);

    return () => {
      tg.MainButton.offClick(stableClick);
      tg.MainButton.hide();
      appliedRef.current = null;
    };
  }, [tg]);

  useEffect(() => {
    if (!tg) return;

    const next: AppliedPayload = { text, visible, enabled, loading };
    const prev = appliedRef.current;

    if (
      prev &&
      prev.text === next.text &&
      prev.visible === next.visible &&
      prev.enabled === next.enabled &&
      prev.loading === next.loading
    ) {
      return;
    }

    if (!next.visible) {
      if (!prev || prev.visible) {
        tg.MainButton.hide();
      }
      appliedRef.current = next;
      return;
    }

    if (!prev || prev.text !== next.text) {
      tg.MainButton.setText(next.text);
    }

    if (!prev || !prev.visible) {
      tg.MainButton.show();
    }

    if (!prev || prev.enabled !== next.enabled) {
      if (next.enabled) tg.MainButton.enable();
      else tg.MainButton.disable();
    }

    if (!prev || prev.loading !== next.loading) {
      if (next.loading) tg.MainButton.showProgress(false);
      else tg.MainButton.hideProgress();
    }

    appliedRef.current = next;
  }, [tg, text, visible, enabled, loading]);
}
