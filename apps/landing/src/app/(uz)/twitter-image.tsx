import { renderOgImage, ogAlt, size, contentType } from '@/lib/og';

// Exists so Next emits `twitter:image` from a real generated route. The metadata
// used to hardcode `/og-image.png`, which had no file behind it and 404'd.
export const alt = ogAlt('uz');
export { size, contentType };

export default async function TwitterImage() {
  return renderOgImage('uz');
}
