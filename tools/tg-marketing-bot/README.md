# tg-marketing-bot — @Maxsavdo_0 kanaliga avtomatik post

Ikki xil ishlash rejimi bor:

| Fayl | Nima qiladi |
|---|---|
| `telegram.js` | **Qo'lda:** botga mavzu yozasiz (yoki `/auto`) → matn+rasm tayyorlab beradi → `/post` bilan kanalga joylanadi |
| `scheduler.js` | **Avtomatik:** kuniga bir marta o'zi mavzu tanlaydi → matn + ovoz + video → kanalga joylaydi |

`scheduler.js` bir marta ishlaydi va chiqadi — uni har kuni ishga tushirish Windows Task
Scheduler zimmasida (`setup_scheduled_task.ps1`).

## Nima qanday generatsiya qilinadi

```
Groq (llama-3.3-70b)      → mavzu, post matni, ovoz uchun skript
Hugging Face (FLUX.1)     → rasm
Edge TTS (uz-UZ-Sardor)   → o'zbekcha ovoz
ffmpeg                    → rasm + ovoz = video
Telegram Bot API          → kanalga sendVideo
```

## Sozlash (bir marta)

1. `npm install`
2. `.env.example` dan nusxa olib `.env` yarating va to'ldiring:

   | Kalit | Qayerdan olinadi |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | @BotFather. Bot `@Maxsavdo_0` da **admin** bo'lishi shart ("Post messages") |
   | `GROQ_API_KEY` | console.groq.com — bepul |
   | `HF_API_TOKEN` | huggingface.co/settings/tokens — read |
   | `ADMIN_CHAT_ID` | 3 xil yo'l — pastdagi "ADMIN_CHAT_ID ni qanday olish" bo'limiga qarang |
   | `CHANNEL` | `@Maxsavdo_0` |
   | `REVIEW_MODE` | birinchi hafta `true` (pastga qarang) |

3. Sinov: `node scheduler.js` — bir post to'liq generatsiya bo'lib yuboriladi.
4. Kunlik jadval: `powershell -ExecutionPolicy Bypass -File setup_scheduled_task.ps1 -Time "09:00"`

## ADMIN_CHAT_ID ni qanday olish

`ADMIN_CHAT_ID` — bu **sizning shaxsiy Telegram ID raqamingiz** (masalan `512345678`).
Kanal ID'si emas, bot ID'si emas — aynan siz. Skript shu chatga xato xabarlari, hisobot va
REVIEW_MODE'dagi qoralamalarni yuboradi.

**Muhim:** bot sizga birinchi bo'lib yoza olmaydi. Avval siz botni ochib **Start** bosishingiz
kerak, aks holda `403: bot can't initiate conversation with a user` xatosi chiqadi.

### 1-yo'l — `get_chat_id.js` (eng ishonchli)
```
# .env da faqat TELEGRAM_BOT_TOKEN to'ldirilgan bo'lsa yetadi
# Telegram'da botingizni oching → Start → istalgan xabar yozing, keyin:
node get_chat_id.js
```
Skript botga yozgan chatlarni ro'yxat qilib beradi. `turi: private` bo'lgan qatordagi
`chat_id` — sizniki.

### 2-yo'l — botning o'zidan `/whoami`
```
node telegram.js
```
Keyin Telegram'da botga `/whoami` yozing — u chat ID'ingizni qaytaradi.
`ADMIN_CHAT_ID` bo'sh bo'lsa ham bot ishga tushadi (faqat `/whoami` ishlaydi) — ID'ni
bilib olib, `.env` ga qo'ying va botni qayta ishga tushiring.

### 3-yo'l — kodsiz, `@userinfobot`
Telegram'da `@userinfobot` ni oching → Start. U sizning ID raqamingizni darhol qaytaradi.
Shaxsiy chatlarda **user ID = chat ID**, shuning uchun bu raqam to'g'ridan-to'g'ri
`ADMIN_CHAT_ID` uchun yaraydi. Faqat bundan keyin ham o'z botingizga Start bosishni unutmang.

## REVIEW_MODE

- `true` — tayyor post **adminga** yuboriladi, kanalga tegmaydi. Ma'qul bo'lsa videoni
  kanalga forward qilasiz.
- `false` — to'g'ridan-to'g'ri kanalga joylanadi.

Birinchi hafta `true` bo'lsin: sifat-nazorati (`lib.js` → `checkPostQuality`) faqat mexanik
tekshiruv qiladi (taqiqlangan iboralar, CTA, hashtag, uzunlik) — brend ohangi mos kelishini
odam ko'rishi kerak.

## Sifat-nazorati (`checkPostQuality`)

Kanalga chiqishdan oldin matn tekshiriladi va o'tmasa **joylanmaydi**, admin ogohlantiriladi:

- taqiqlangan iboralar: `multi-do'kon`, `ko'p do'kon`, `mobil ilova`, `eng yaxshi`, ... —
  mahsulotda yo'q narsalarni va'da qilmaslik uchun (bir seller = bir do'kon, mobil ilova yo'q)
- `@maxsavdo_bot` CTA bo'lishi shart
- hashtag bo'lishi shart, matn ≥ 40 belgi

## Cheklovlar

- **Task Scheduler faqat shu kompyuter yoqilgan bo'lganda ishlaydi.** Standart holatda
  tizimga kirgan (logged on) bo'lish ham shart. Kompyuter o'chiq bo'lsa, o'sha kunlik post
  o'tkazib yuboriladi (`-StartWhenAvailable` keyingi yoqilishda quvib yetadi).
  Doimiy ishlashi kerak bo'lsa — Railway cron'ga ko'chirish kerak (ffmpeg image'ga qo'shiladi).
- Kunlik dedup: `posted_topics.json` — oxirgi 30 mavzu takrorlanmaydi.
- Barcha vaqtinchalik fayllar (`_scheduler_*.jpg/mp3/mp4`) har ishdan keyin o'chiriladi.
