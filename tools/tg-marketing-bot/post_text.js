// Oddiy matnli post (video/rasmsiz) kanalga joylash uchun.
//
// Ishlatish:
//   node post_text.js "<caption matni>"

require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.CHANNEL;

(async () => {
  const arg = process.argv[2];
  const text = arg && fs.existsSync(arg) ? fs.readFileSync(arg, "utf-8") : arg;

  for (const [name, value] of Object.entries({ TELEGRAM_BOT_TOKEN, CHANNEL })) {
    if (!value) {
      console.error(`Xato: .env faylida ${name} to'ldirilmagan.`);
      process.exit(1);
    }
  }
  if (!text) {
    console.error("Xato: caption matni berilmagan. Ishlatish: node post_text.js \"matn\"");
    process.exit(1);
  }

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  console.log(`Kanalga yuborilmoqda: ${CHANNEL}`);
  const sent = await bot.sendMessage(CHANNEL, text, { parse_mode: "HTML", disable_web_page_preview: true });
  fs.appendFileSync(
    "C:/Users/User/Desktop/Max_savdo_tg_bot/post_log.jsonl",
    JSON.stringify({ ts: new Date().toISOString(), type: "text", message_id: sent.message_id }) + "\n",
  );
  console.log(`Muvaffaqiyatli joylandi! message_id=${sent.message_id} (o'chirish uchun: node delete_post.js ${sent.message_id})`);
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
