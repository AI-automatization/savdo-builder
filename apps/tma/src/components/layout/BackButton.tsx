import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';

const rootPaths = ['/', '/buyer', '/seller'];

export function BackButton() {
  const { tg } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tg) return;

    const isRoot = rootPaths.includes(location.pathname);
    if (isRoot) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    const handler = () => navigate(-1);
    tg.BackButton.onClick(handler);
    return () => tg.BackButton.offClick(handler);
  }, [tg, location.pathname, navigate]);

  return null;
}
