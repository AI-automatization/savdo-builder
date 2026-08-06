/**
 * JSON.stringify не знает про HTML-контекст: `</script>` внутри строки
 * закрывает тег и превращает данные продавца в исполняемый код (stored XSS).
 * Экранируем `<`, `>`, `&` и U+2028/U+2029 в \uXXXX — JSON-парсер браузера
 * читает их как исходные символы, HTML-парсер уже не видит тег.
 *
 * Schema.org-валидность не страдает: после парсинга это те же символы.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
