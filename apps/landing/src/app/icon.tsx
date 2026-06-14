import { ImageResponse } from 'next/og'

// Next.js 15: динамический favicon через ImageResponse — заменяет статический
// favicon.ico. Sizes 32x32 — стандарт browser tab. На retina рендерится резко.
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0F0F0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C9A876',
          fontSize: 24,
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        M
      </div>
    ),
    { ...size },
  )
}
