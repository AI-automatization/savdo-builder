import { Injectable } from '@nestjs/common';

/**
 * FEAT-TG-CHANNEL-TEMPLATE-001: рендер шаблона поста в TG-канал.
 *
 * Поддерживается ограниченный Mustache-подобный синтаксис:
 *   {{var}}              — подставляет escape'нутое значение
 *   {{#var}}...{{/var}}  — секция: рендерится только если var truthy
 *
 * Whitelist переменных (см. `TemplateVariables`) — больше ничего рендерить
 * не будем (защита от того что продавец впишет `{{store.adminToken}}`
 * случайно или специально). Любая `{{неизвестная_переменная}}` → пустая
 * строка, и от секции `{{#неизвестная}}...{{/}}` остаётся пустота.
 *
 * Telegram HTML allowed: <b>, <i>, <u>, <s>, <a>, <code>, <pre>. Остальное
 * экранируется. Шаблон ПРОДАВЦА уже может содержать эти теги (мы их сохраняем),
 * но значения переменных всегда HTML-escape'нуты.
 */

export interface TemplateVariables {
  title: string;
  price: string;            // formatted "399.000 сум"
  oldPrice: string;         // formatted, '' если нет
  hasOldPrice: boolean;
  description: string;
  material: string;         // из attributes, '' если нет
  sizes: string;            // из variants/attributes, '' если нет
  availability: string;     // "В наличии" / "Под заказ"
  deliveryDays: string;     // "1", '' если нет
  contact: string;          // @username или phone — приоритет phone если есть
  instagram: string;        // ссылка, '' если нет
  tiktok: string;
  storeName: string;
  channelLink: string;      // t.me/<channel>
  productUrl: string;       // ссылка на товар в нашей платформе
}

export const TEMPLATE_VARIABLE_KEYS: Array<keyof TemplateVariables> = [
  'title', 'price', 'oldPrice', 'hasOldPrice', 'description', 'material',
  'sizes', 'availability', 'deliveryDays', 'contact', 'instagram', 'tiktok',
  'storeName', 'channelLink', 'productUrl',
];

@Injectable()
export class ChannelTemplateService {
  /**
   * Дефолтный шаблон — повторяет структуру постов которые работают в UZ
   * (ArloeStore_UZ, Eleganza, Montanno и т.д. — реальные образцы 2026).
   */
  static readonly DEFAULT_TEMPLATE = [
    '<b>{{title}}</b>',
    '',
    '💰 Цена: <b>{{price}}</b>{{#hasOldPrice}} <s>{{oldPrice}}</s>{{/hasOldPrice}}',
    '{{#material}}📦 Материал: {{material}}{{/material}}',
    '{{#sizes}}📏 Размеры: {{sizes}}{{/sizes}}',
    '{{availability}}',
    '{{#deliveryDays}}🚚 Доставка: {{deliveryDays}} день{{/deliveryDays}}',
    '',
    '📞 Для заказа: {{contact}}',
    '{{#instagram}}📷 Instagram: {{instagram}}{{/instagram}}',
    '{{#tiktok}}🎵 TikTok: {{tiktok}}{{/tiktok}}',
    '',
    '<a href="{{productUrl}}">Открыть товар →</a>',
  ].join('\n');

  /** Caption limit для sendPhoto/sendMediaGroup. */
  static readonly TG_CAPTION_LIMIT = 1024;

  /**
   * Telegram HTML mode разрешает только эти теги. Остальное → 400 "can't parse
   * entities". Этим whitelist'ом мы sanitize пользовательский шаблон при render:
   * разрешённые теги пропускаем, неразрешённые экранируем как текст.
   * https://core.telegram.org/bots/api#html-style
   */
  static readonly TG_ALLOWED_TAGS = new Set([
    'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del',
    'a', 'code', 'pre', 'blockquote', 'tg-spoiler', 'br',
  ]);

  render(template: string | null | undefined, vars: TemplateVariables): string {
    const tpl = template?.trim() ? template : ChannelTemplateService.DEFAULT_TEMPLATE;

    let out = this.renderSections(tpl, vars);
    out = this.renderVariables(out, vars);
    out = this.sanitizeTags(out);
    out = this.collapseEmptyLines(out);
    out = this.safeTruncate(out, ChannelTemplateService.TG_CAPTION_LIMIT);

    return out;
  }

  /**
   * Validate template at save-time — даёт продавцу понятную ошибку до того,
   * как пост улетит в TG и упадёт с 400. Возвращает список tag-имён которые
   * будут escape'нуты при рендере (это not fatal — но предупреждение в UI).
   */
  findUnsupportedTags(template: string): string[] {
    const tags = new Set<string>();
    const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(template)) !== null) {
      const tag = m[1].toLowerCase();
      if (!ChannelTemplateService.TG_ALLOWED_TAGS.has(tag)) tags.add(tag);
    }
    return Array.from(tags);
  }

  /**
   * Escape любых тегов, не входящих в TG_ALLOWED_TAGS. Allowed теги остаются
   * как есть. Атрибуты внутри allowed тегов оставляем (Telegram отвалидирует
   * сам — он принимает только `href` для `<a>` и `class` для `<span>`).
   */
  private sanitizeTags(text: string): string {
    return text.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (full, slash, rawTag, rest) => {
      const tag = rawTag.toLowerCase();
      if (ChannelTemplateService.TG_ALLOWED_TAGS.has(tag)) return full;
      // не разрешённый — заменяем `<` `>` чтобы Telegram парсил как текст
      return `&lt;${slash}${rawTag}${rest}&gt;`;
    });
  }

  /**
   * Безопасное обрезание HTML-aware: не режем тег пополам, закрываем
   * открытые теги в конце. Простой стек-парсер — достаточно для нашего
   * whitelist.
   */
  private safeTruncate(text: string, limit: number): string {
    if (text.length <= limit) return text;

    // Откатываемся до символа, который не находится внутри тега.
    let cut = limit - 1;
    while (cut > 0) {
      const lt = text.lastIndexOf('<', cut);
      const gt = text.lastIndexOf('>', cut);
      if (lt <= gt) break; // не внутри незакрытого `<…`
      cut = lt - 1;
    }
    let truncated = text.slice(0, cut);

    // Подсчитаем открытые теги (только из whitelist) и закроем в конце.
    const openStack: string[] = [];
    const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(truncated)) !== null) {
      const tag = m[2].toLowerCase();
      if (!ChannelTemplateService.TG_ALLOWED_TAGS.has(tag)) continue;
      if (tag === 'br') continue; // self-closing
      if (m[1] === '/') {
        const idx = openStack.lastIndexOf(tag);
        if (idx !== -1) openStack.splice(idx, 1);
      } else {
        openStack.push(tag);
      }
    }
    const closing = openStack.reverse().map((t) => `</${t}>`).join('');

    return truncated + '…' + closing;
  }

  /** `{{#var}}...{{/var}}` — секция рендерится если var truthy. */
  private renderSections(tpl: string, vars: TemplateVariables): string {
    return tpl.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_match, key, body) => {
      if (!TEMPLATE_VARIABLE_KEYS.includes(key as keyof TemplateVariables)) return '';
      const v = vars[key as keyof TemplateVariables];
      return v ? body : '';
    });
  }

  /** `{{var}}` — escape'нутое значение, или пусто если переменная неизвестна. */
  private renderVariables(tpl: string, vars: TemplateVariables): string {
    return tpl.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      if (!TEMPLATE_VARIABLE_KEYS.includes(key as keyof TemplateVariables)) return '';
      const v = vars[key as keyof TemplateVariables];
      if (typeof v === 'boolean') return '';
      return this.escapeHtml(String(v ?? ''));
    });
  }

  /** Убираем последствия пустых секций (`Размеры:` без значения → строка-пустышка). */
  private collapseEmptyLines(text: string): string {
    return text
      .split('\n')
      .filter((line, idx, arr) => {
        if (line.trim() !== '') return true;
        // оставляем максимум одну подряд пустую строку
        return idx === 0 || arr[idx - 1].trim() !== '';
      })
      .join('\n')
      .trim();
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
