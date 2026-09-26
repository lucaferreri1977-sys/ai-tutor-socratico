import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
          borderRadius: 18,
          fontSize: 40,
        }}
      >
        🦉
      </div>
    ),
    {
      ...size,
    }
  );
}
