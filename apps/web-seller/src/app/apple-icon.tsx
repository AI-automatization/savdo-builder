import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 28,
            width: 70,
            height: 44,
            border: '6px solid #C9A876',
            borderBottom: 'none',
            borderRadius: '100% 100% 0 0 / 100% 100% 0 0',
          }}
        />
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: '#C9A876',
            lineHeight: 1,
            marginTop: 24,
            letterSpacing: -6,
            fontFamily: 'sans-serif',
          }}
        >
          M
        </div>
      </div>
    ),
    size,
  );
}
