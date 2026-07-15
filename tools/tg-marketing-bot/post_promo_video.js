// Remotion orqali tayyorlangan promo videoni kanalga joylash.
// Har safar "Max Savdo/promo-video" loyihasida yangi video render qilinganda shu skript orqali joylanadi.
//
// Ishlatish:
//   node post_promo_video.js "<video.mp4 yo'li>" "<caption matni>"
// Argumentsiz ishga tushirilsa quyidagi standart video va caption ishlatiladi.

require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.CHANNEL;

const DEFAULT_VIDEO = "C:/Users/User/Desktop/Max Savdo/maxsavdo-promo.mp4";
const DEFAULT_CAPTION = `🤖 Telegram'da sotishni xohlaysiz, lekin dasturchisiz qiynalyapsizmi?

✅ Telegram orqali 5 soniyada kirish — SMS kod kerak emas
✅ Do'koningizni o'zingiz yig'ing — mahsulot, narx va rasm qo'shish oson
✅ Hammasi bir joyda — chalkashliksiz, faqat sotuvga e'tibor

Bugunoq sotishni boshlang! ➡️ @maxsavdo_bot

#MaxSavdo #TelegramBot #OnlaynSavdo #Tadbirkorlik #Ozbekiston #Dokon`;

function truncateCaption(text, max = 1024) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

(async () => {
  const videoPath = process.argv[2] || DEFAULT_VIDEO;
  const captionArg = process.argv[3];
  const caption = captionArg && fs.existsSync(captionArg) ? fs.readFileSync(captionArg, "utf-8") : captionArg || DEFAULT_CAPTION;

  for (const [name, value] of Object.entries({ TELEGRAM_BOT_TOKEN, CHANNEL })) {
    if (!value) {
      console.error(`Xato: .env faylida ${name} to'ldirilmagan.`);
      process.exit(1);
    }
  }
  if (!fs.existsSync(videoPath)) {
    console.error(`Xato: video topilmadi: ${videoPath}`);
    process.exit(1);
  }

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  console.log(`Kanalga yuborilmoqda: ${CHANNEL} <- ${videoPath}`);
  const sent = await bot.sendVideo(CHANNEL, videoPath, {
    caption: truncateCaption(caption),
    parse_mode: "HTML",
    supports_streaming: true,
  });
  fs.appendFileSync(
    "C:/Users/User/Desktop/Max_savdo_tg_bot/post_log.jsonl",
    JSON.stringify({ ts: new Date().toISOString(), type: "video", message_id: sent.message_id, video: videoPath }) + "\n",
  );
  console.log(`Muvaffaqiyatli joylandi! message_id=${sent.message_id} (o'chirish uchun: node delete_post.js ${sent.message_id})`);
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
