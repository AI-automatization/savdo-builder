/**
 * Тесты для `ChannelTemplateService`.
 *
 * Покрытие:
 *   - render: подстановка переменных + секции
 *   - HTML escape на ЗНАЧЕНИЯХ переменных
 *   - sanitize: неподдерживаемые TG-теги в шаблоне продавца → escape
 *   - findUnsupportedTags: возврат списка для UI-warning
 *   - safeTruncate: не режет HTML тег, закрывает открытые теги
 *   - дефолтный шаблон рендерится без ошибок
 */
import { ChannelTemplateService, TemplateVariables } from './channel-template.service';

const BASE_VARS: TemplateVariables = {
  title: 'iPhone 15',
  price: '12 000 000 UZS',
  oldPrice: '',
  hasOldPrice: false,
  description: 'Latest model',
  material: 'aluminium',
  sizes: '',
  availability: 'В наличии',
  deliveryDays: '1',
  contact: '@apple_admin',
  instagram: 'https://instagram.com/apple',
  tiktok: '',
  storeName: 'Apple Tashkent',
  channelLink: 'https://t.me/apple_uz',
  productUrl: 'https://savdo.uz/apple/products/1',
};

describe('ChannelTemplateService', () => {
  const svc = new ChannelTemplateService();

  describe('variable substitution', () => {
    it('подставляет {{title}} с HTML escape', () => {
      const out = svc.render('<b>{{title}}</b>', { ...BASE_VARS, title: '<script>x</script>' });
      expect(out).toContain('&lt;script&gt;');
      expect(out).toContain('<b>');
    });

    it('неизвестная переменная → пустая подстановка', () => {
      const out = svc.render('A {{unknown}} B', BASE_VARS);
      expect(out).toBe('A  B');
    });
  });

  describe('sections {{#var}}…{{/var}}', () => {
    it('truthy var → секция рендерится', () => {
      const out = svc.render('{{#material}}M:{{material}}{{/material}}', BASE_VARS);
      expect(out).toContain('M:aluminium');
    });

    it('falsy var → секция пустая', () => {
      const out = svc.render('A{{#sizes}}S:{{sizes}}{{/sizes}}B', BASE_VARS);
      expect(out).toBe('AB');
    });

    it('hasOldPrice=true → секция с oldPrice', () => {
      const out = svc.render(
        '{{price}}{{#hasOldPrice}} <s>{{oldPrice}}</s>{{/hasOldPrice}}',
        { ...BASE_VARS, hasOldPrice: true, oldPrice: '15 000 000 UZS' },
      );
      expect(out).toContain('<s>15');
    });
  });

  describe('sanitize unsupported tags (CRITICAL)', () => {
    it('продавец вписал <div> → escape (TG отвергнет иначе)', () => {
      const out = svc.render('<div>{{title}}</div>', BASE_VARS);
      expect(out).not.toContain('<div>');
      expect(out).toContain('&lt;div&gt;');
      expect(out).toContain('iPhone 15');
    });

    it('<script> → escape (XSS вектор + TG 400)', () => {
      const out = svc.render('<script>evil()</script>', BASE_VARS);
      expect(out).not.toMatch(/<script>/);
      expect(out).toContain('&lt;script&gt;');
    });

    it('<b>, <i>, <a> — разрешены, остаются как есть', () => {
      const out = svc.render('<b>Bold</b> <i>Italic</i> <a href="x">Link</a>', BASE_VARS);
      expect(out).toContain('<b>Bold</b>');
      expect(out).toContain('<i>Italic</i>');
      expect(out).toContain('<a href="x">Link</a>');
    });
  });

  describe('findUnsupportedTags (UI warning)', () => {
    it('возвращает список неподдерживаемых тегов', () => {
      const tags = svc.findUnsupportedTags('<div><b>x</b><span>y</span></div><script>z');
      expect(tags).toEqual(expect.arrayContaining(['div', 'span', 'script']));
      expect(tags).not.toContain('b');
    });

    it('чистый allowed-only → пустой массив', () => {
      expect(svc.findUnsupportedTags('<b>x</b><i>y</i>')).toEqual([]);
    });
  });

  describe('safeTruncate (CRITICAL — TG 400 если рвём тег)', () => {
    it('текст в пределах limit → без изменений', () => {
      const short = 'short';
      const out = svc.render(short, BASE_VARS);
      expect(out).toBe('short');
    });

    it('long text — обрезается до limit и закрывает открытые теги', () => {
      const longText = '<b>' + 'A'.repeat(2000) + '</b>';
      const out = svc.render(longText, BASE_VARS);
      expect(out.length).toBeLessThanOrEqual(ChannelTemplateService.TG_CAPTION_LIMIT + 10);
      // открытый <b> должен быть закрыт
      const opens = (out.match(/<b>/g) ?? []).length;
      const closes = (out.match(/<\/b>/g) ?? []).length;
      expect(closes).toBeGreaterThanOrEqual(opens);
    });

    it('обрезка не разрезает тег пополам', () => {
      // подбираем длину так, чтобы лимит попал внутрь тега
      const padding = 'X'.repeat(ChannelTemplateService.TG_CAPTION_LIMIT - 10);
      const tpl = padding + '<a href="https://very-long-url.example.com/path">link</a>';
      const out = svc.render(tpl, BASE_VARS);
      // не должно быть оборванного `<a href="...`
      expect(out).not.toMatch(/<a [^>]*$/);
    });
  });

  describe('default template', () => {
    it('содержит цену, контакт, availability', () => {
      const out = svc.render(null, BASE_VARS);
      expect(out).toContain('12 000 000 UZS');
      expect(out).toContain('@apple_admin');
      expect(out).toContain('В наличии');
      expect(out).toContain('iPhone 15');
    });

    it('пустой template → fallback на default', () => {
      const outNull = svc.render(null, BASE_VARS);
      const outEmpty = svc.render('  ', BASE_VARS);
      expect(outNull).toEqual(outEmpty);
    });
  });
});
