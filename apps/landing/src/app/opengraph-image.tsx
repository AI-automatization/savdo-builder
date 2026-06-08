import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MaxSavdo — 3 sotuv kanali';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background:
            'linear-gradient(135deg, #0F172A 0%, #1E293B 45%, #0EA5E9 100%)',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '36px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#FFFFFF',
              color: '#0EA5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 900,
            }}
          >
            M
          </div>
          MaxSavdo
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '88px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              maxWidth: '1000px',
            }}
          >
            MaxSavdo — 3 sotuv kanali
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '900px',
            }}
          >
            Bot, sayt-vitrina va Telegram kanal — bitta akkauntdan
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.75)',
          }}
        >
          <span>maxsavdo.uz</span>
          <span style={{ fontWeight: 600 }}>14 kun bepul</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
