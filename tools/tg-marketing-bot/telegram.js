// Telegram bot: siz botga mavzu yozasiz (yoki /auto - AI o'zi mavzu tanlaydi) -> Groq orqali post matni,
// Hugging Face (bepul) orqali rasm generatsiya qiladi -> tayyor postni sizga qaytaradi
//
// Ishlatish: npm install && node telegram.js
// Sozlash: .env faylini to'ldiring (.env.example'ga qarang)

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const {
  generateTopic,
  generatePostText,
  generateImage,
  escapeHtml,
  truncateCaption,
} = require("./lib");

// ===== SOZLAMALAR - .env faylidan o'qiladi =====
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const CHANNEL = process.env.CHANNEL; // masalan: @Maxsavdo_0

const REQUIRED = {
  TELEGRAM_BOT_TOKEN,
  GROQ_API_KEY,
  HF_API_TOKEN,
  CHANNEL,
};
for (const [name, value] of Object.entries(REQUIRED)) {
  if (!value || value.startsWith("SIZNING_")) {
    console.error(
      `Xato: .env faylida ${name} to'ldirilmagan. .env.example'ga qarang.`,
    );
    process.exit(1);
  }
}

// ADMIN_CHAT_ID ataylab majburiy emas: uni bilish uchun aynan shu botga /whoami yozish kerak,
// majburiy qilinsa bot umuman ishga tushmaydi va ID'ni hech qachon bilib bo'lmaydi.
// To'ldirilmaguncha bot faqat /whoami ga javob beradi, boshqa hamma buyruq yopiq.
if (!ADMIN_CHAT_ID) {
  console.warn(
    "Diqqat: ADMIN_CHAT_ID to'ldirilmagan. Botga /whoami yozing — u sizga chat ID'ingizni qaytaradi,\n" +
      "keyin uni .env ga qo'yib botni qayta ishga tushiring. Shu holatda boshqa buyruqlar ishlamaydi.",
  );
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("polling_error", (err) => {
  console.error("Polling xatosi:", err.message);
});

function isAdmin(chatId) {
  if (!ADMIN_CHAT_ID) return false;
  return String(chatId) === String(ADMIN_CHAT_ID);
}

// ===== 3. Tayyor postni kanalga yuborish =====
async function postToChannel(imageBuffer, caption) {
  await bot.sendPhoto(CHANNEL, imageBuffer, {
    caption: truncateCaption(caption),
    parse_mode: "HTML",
  });
}

// Tasdiqlangan postlarni vaqtincha saqlash uchun
const pendingPosts = {};

// Mavzu berilgach: matn+rasmni generatsiya qilib, tasdiqlash uchun chatga yuboradi
async function prepareDraft(chatId, topic) {
  await bot.sendMessage(chatId, "Tayyorlanmoqda, biroz kuting...");

  const safeTopic = topic.slice(0, 300);

  // Matn va rasmni parallel generatsiya qilish
  const [postText, imageBuffer] = await Promise.all([
    generatePostText(safeTopic),
    generateImage(safeTopic),
  ]);

  const safeCaption = escapeHtml(postText);

  // Sizga tekshirish uchun tayyor postni yuboradi
  await bot.sendPhoto(chatId, imageBuffer, {
    caption: truncateCaption(
      safeCaption +
        "\n\n---\nTasdiqlash uchun: /post\nBekor qilish uchun: /cancel",
    ),
    parse_mode: "HTML",
  });

  // Vaqtincha xotirada saqlab turish (keyingi /post buyrug'i uchun)
  pendingPosts[chatId] = { postText: safeCaption, imageBuffer };
}

// ===== 4. Botga yozilgan xabarni tinglash (faqat admin uchun) =====
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const topic = msg.text;

  if (!topic || topic.startsWith("/")) return;

  if (!isAdmin(chatId)) {
    console.log(`Ruxsatsiz kirish urinishi, chatId=${chatId}`);
    return;
  }

  try {
    await prepareDraft(chatId, topic);
  } catch (error) {
    console.error("Xato:", error);
    await bot.sendMessage(chatId, "Xatolik chiqdi: " + error.message);
  }
});

// ===== 4b. /auto - AI o'zi mavzuni o'ylab topib, postni tayyorlaydi (faqat admin) =====
bot.onText(/^\/auto$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  try {
    await bot.sendMessage(chatId, "Mavzu o'ylanmoqda...");
    const topic = await generateTopic();
    await bot.sendMessage(chatId, `Tanlangan mavzu: ${topic}`);
    await prepareDraft(chatId, topic);
  } catch (error) {
    console.error("Xato:", error);
    await bot.sendMessage(chatId, "Xatolik chiqdi: " + error.message);
  }
});

// ===== 5. /post buyrug'i - tasdiqlangandan keyin kanalga joylash (faqat admin) =====
bot.onText(/^\/post$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const pending = pendingPosts[chatId];
  if (!pending) {
    return bot.sendMessage(
      chatId,
      "Avval biror mavzu yozing, keyin tasdiqlang.",
    );
  }

  try {
    await postToChannel(pending.imageBuffer, pending.postText);
    await bot.sendMessage(chatId, "Kanalga joylandi.");
  } catch (error) {
    console.error("Kanalga joylashda xato:", error);
    await bot.sendMessage(chatId, "Kanalga joylashda xatolik: " + error.message);
  } finally {
    delete pendingPosts[chatId];
  }
});

bot.onText(/^\/cancel$/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;
  delete pendingPosts[chatId];
  bot.sendMessage(chatId, "Bekor qilindi.");
});

// Admin o'z chat ID'sini bilib olishi uchun (ADMIN_CHAT_ID sozlash uchun kerak).
// Bu buyruq ataylab hammaga ochiq — ADMIN_CHAT_ID hali ma'lum bo'lmaganda ham ishlashi kerak.
// Xavfsizlik nuqtai nazaridan zararsiz: odam faqat o'zining chat ID'sini biladi.
bot.onText(/^\/whoami$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Sizning chat ID'ingiz: ${msg.chat.id}\n\n` +
      `Shu raqamni .env faylidagi ADMIN_CHAT_ID ga qo'ying va botni qayta ishga tushiring.`,
  );
});

console.log("Bot ishga tushdi, xabar kutilmoqda...");
