import { renderOgImage, ogAlt, size, contentType } from '@/lib/og';

export const alt = ogAlt('ru');
export { size, contentType };

export default async function TwitterImageRu() {
  return renderOgImage('ru');
}
