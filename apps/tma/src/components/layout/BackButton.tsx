import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';

const rootPaths = ['/', '/buyer', '/seller', '/seller/store', '/buyer/settings', '/seller/settings'];

/**
 * BackButton — синхронизирует видимость Telegram BackButton с роутером.
 *
 * 08.06.2026: добавлен idempotency-чек, чтобы повторные ре-рендеры
 * (например, из-за useTelegram() обновлений) не вызывали повторный
 * `web_app_setup_back_button` postEvent с тем же значением. Хендлер
 * `navigate(-1)` биндим один раз через ref-pattern.
 */
export function BackButton() {
  const { tg } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Бинд клика один раз на жизнь tg — без re-bind при смене pathname.
  useEffect(() => {
    if (!tg) return;
    const handler = () => navigateRef.current(-1);
    tg.BackButton.onClick(handler);
    return () => {
      tg.BackButton.offClick(handler);
    };
  }, [tg]);

  // Видимость — только при реальном изменении состояния (show/hide).
  const lastVisibleRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!tg) return;
    const shouldShow = !rootPaths.includes(location.pathname);
    if (lastVisibleRef.current === shouldShow) return;
    if (shouldShow) tg.BackButton.show();
    else tg.BackButton.hide();
    lastVisibleRef.current = shouldShow;
  }, [tg, location.pathname]);

  return null;
}
