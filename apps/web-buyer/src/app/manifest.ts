import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Savdo — магазины Узбекистана',
    short_name: 'Savdo',
    description: 'Покупайте у продавцов Узбекистана через Telegram. Быстро, удобно, без регистрации.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF7F0',
    theme_color: '#A05A45',
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
