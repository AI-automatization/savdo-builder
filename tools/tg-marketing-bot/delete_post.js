// Kanaldagi postni message_id bo'yicha o'chirish.
// post_text.js va post_promo_video.js har bir postdan keyin message_id ni ekranga chiqaradi
// va post_log.jsonl fayliga yozadi.
//
// Ishlatish:
//   node delete_post.js <message_id>

require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.CHANNEL;

(async () => {
  const messageId = process.argv[2];

  for (const [name, value] of Object.entries({ TELEGRAM_BOT_TOKEN, CHANNEL })) {
    if (!value) {
      console.error(`Xato: .env faylida ${name} to'ldirilmagan.`);
      process.exit(1);
    }
  }
  if (!messageId) {
    console.error("Xato: message_id berilmagan. Ishlatish: node delete_post.js <message_id>");
    process.exit(1);
  }

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  await bot.deleteMessage(CHANNEL, Number(messageId));
  console.log(`Post o'chirildi: message_id=${messageId}`);
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
