import { ImageResponse } from 'next/og';
import { t, type Locale } from '@/lib/i18n';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Short, verifiable badge. The previous "14 kun bepul" was wrong — there is no
 *  trial period; the Free tier simply has no time limit (see FAQ). */
const BADGE: Record<Locale, string> = {
  uz: 'Komissiyasiz',
  ru: 'Без комиссии',
};

export function ogAlt(locale: Locale) {
  return t(locale).meta.ogTitle;
}

export function renderOgImage(locale: Locale) {
  const dict = t(locale);

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '76px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              maxWidth: '1000px',
            }}
          >
            {dict.meta.ogTitle}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '900px',
            }}
          >
            {dict.meta.ogDescription}
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
          <span style={{ fontWeight: 600 }}>{BADGE[locale]}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
