/**
 * Escape user-controlled strings before inlining them into Telegram HTML messages.
 *
 * Telegram parse_mode='HTML' only accepts a small whitelist of tags (<b>, <i>, <a>,
 * <code>, ...). Unescaped `<`, `>` or `&` in user data either reject the whole
 * message (parse error → silent drop) or let user input inject working markup
 * (<a href> links pointing anywhere). Telegram Bot API docs explicitly require
 * escaping these three characters: https://core.telegram.org/bots/api#html-style
 *
 * Use anywhere user-controlled data (product.title, store.name, firstName, etc.)
 * gets interpolated into a string sent with parseMode='HTML'.
 */
export function escapeTgHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
