# Guide screenshots

Real captures of the flow, not stock art or mockups — Experience is the E-E-A-T
dimension a competitor cannot fabricate, and it is the one the guides are missing.

## How to add one

1. Drop the file here, e.g. `open-shop-bot-start.png`.
2. Point a section at it in `src/lib/guides.ts`:

```ts
{
  heading: "Botni ochish",
  body: ["..."],
  image: {
    src: "/guides/open-shop-bot-start.png",
    alt: "@maxsavdo_bot Telegramda, «Boshlash» tugmasi bosilgan holat",
    width: 1170,          // the file's real pixels, not the display size
    height: 2532,
    caption: "Kirish Telegram akkaunti orqali — SMS kod kelmaydi",
  },
}
```

`GuideBody.tsx` renders it already; no component change needed.

## Rules

- `width`/`height` are the file's **intrinsic** pixels. They let the browser reserve
  the box before the file lands, which is what keeps CLS at zero.
- `alt` describes what is on screen. It is not a second copy of the heading and not
  a place for keywords.
- Crop out personal data: real customer names, phone numbers, order totals.
- Phone captures are fine — most of this traffic is mobile.

## Wanted first (open-shop guide, the highest-intent one)

1. `@maxsavdo_bot` chat, the moment «Boshlash» is pressed
2. Shop name entry, with the generated `shop.maxsavdo.uz/<slug>` visible
3. Adding a product — photo, price, description
4. The finished storefront as a buyer sees it
