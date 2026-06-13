import { ImageResponse } from 'next/og'

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
          borderRadius: '7px',
        }}
      >
        {/* M split: left half white, right half gold */}
        <div style={{ display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* Left half — white */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', overflow: 'hidden', display: 'flex' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#F5F5F5', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1 }}>
              M
            </span>
          </div>
          {/* Right half — gold */}
          <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '100%', overflow: 'hidden', display: 'flex' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#C9A876', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1, marginLeft: '-50%' }}>
              M
            </span>
          </div>
          {/* Spacer to set container width */}
          <span style={{ fontSize: 22, fontWeight: 900, color: 'transparent', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1 }}>
            M
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
