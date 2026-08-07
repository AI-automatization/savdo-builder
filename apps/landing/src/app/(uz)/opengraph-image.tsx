import { renderOgImage, ogAlt, size, contentType } from '@/lib/og';

// No `runtime = 'edge'` any more: on the Node runtime this image is generated at
// build time and served as a static asset instead of being rendered per request.
export const alt = ogAlt('uz');
export { size, contentType };

export default async function OpengraphImage() {
  return renderOgImage('uz');
}
