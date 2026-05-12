import { useEffect } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';

interface UseMainButtonOptions {
  text: string;
  onClick: () => void;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
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
 * ВАЖНО: оборачивай `onClick` в useCallback с правильными deps, иначе
 * на каждом рендере MainButton будет re-binding handler (дешёво, но
 * генерирует лишнюю работу).
 */
export function useMainButton(opts: UseMainButtonOptions): void {
  const { tg } = useTelegram();
  const { text, onClick, visible = true, enabled = true, loading = false } = opts;

  useEffect(() => {
    if (!tg) return;
    if (!visible) {
      tg.MainButton.hide();
      return;
    }
    tg.MainButton.setText(text);
    tg.MainButton.show();

    if (enabled) tg.MainButton.enable();
    else tg.MainButton.disable();

    if (loading) tg.MainButton.showProgress(false);
    else tg.MainButton.hideProgress();

    tg.MainButton.onClick(onClick);
    return () => {
      tg.MainButton.offClick(onClick);
      tg.MainButton.hide();
    };
  }, [tg, text, onClick, visible, enabled, loading]);
}
