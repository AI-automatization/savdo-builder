import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'maxsavdo — магазины Узбекистана в Telegram';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,118,0.12), transparent)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          gap: 32,
        }}
      >
        {/* M mark — dark rounded square с golden M + handle */}
        <div
          style={{
            width: 220,
            height: 220,
            background: '#0A0A0A',
            border: '4px solid rgba(201,168,118,0.4)',
            borderRadius: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Handle arc — упрощённая через border-radius div */}
          <div
            style={{
              position: 'absolute',
              top: 30,
              width: 80,
              height: 50,
              border: '7px solid #C9A876',
              borderBottom: 'none',
              borderRadius: '100% 100% 0 0 / 100% 100% 0 0',
            }}
          />
          {/* M letterform */}
          <div
            style={{
              fontSize: 180,
              fontWeight: 900,
              color: '#C9A876',
              lineHeight: 1,
              marginTop: 26,
              letterSpacing: -8,
            }}
          >
            M
          </div>
        </div>

        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: -2,
            marginTop: 16,
          }}
        >
          maxsavdo
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#A3A3A3',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Магазины Узбекистана в Telegram
        </div>
      </div>
    ),
    size,
  );
}
