import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'maxsavdo — магазины Узбекистана',
    short_name: 'maxsavdo',
    description: 'Покупайте у продавцов Узбекистана через Telegram. Быстро, удобно, без регистрации.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0F0F',
    theme_color: '#E8A552',
    lang: 'ru',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
