// Kunlik avtomatik post: AI mavzu tanlaydi, matn+ovoz+video generatsiya qiladi
// va kanalga to'g'ridan-to'g'ri joylaydi. Bir marta ishga tushib, tugab, chiqadi.
//
// Har kuni avtomatik ishga tushishi uchun Windows Task Scheduler orqali chaqiriladi
// (qarang: setup_scheduled_task.ps1)

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const {
  generateTopic,
  generatePostText,
  generateNarrationScript,
  generateImage,
  generateVoice,
  buildVideo,
  escapeHtml,
  truncateCaption,
  checkPostQuality,
} = require("./lib");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const CHANNEL = process.env.CHANNEL;

for (const [name, value] of Object.entries({ TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID, CHANNEL })) {
  if (!value) {
    console.error(`Xato: .env faylida ${name} to'ldirilmagan.`);
    process.exit(1);
  }
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

// ===== Dedup: oxirgi mavzularni eslab qolish (bir xil mavzu qayta-qayta chiqmasligi uchun) =====
const TOPICS_LOG_PATH = path.join(__dirname, "posted_topics.json");
const RECENT_TOPICS_LIMIT = 30;

function loadRecentTopics() {
  if (!fs.existsSync(TOPICS_LOG_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(TOPICS_LOG_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveTopic(topic) {
  const list = loadRecentTopics();
  list.push({ topic, date: new Date().toISOString() });
  fs.writeFileSync(TOPICS_LOG_PATH, JSON.stringify(list.slice(-RECENT_TOPICS_LIMIT), null, 2));
}

async function pickFreshTopic() {
  const recent = loadRecentTopics().map((t) => t.topic);
  for (let attempt = 0; attempt < 2; attempt++) {
    const topic = await generateTopic(recent);
    const isDuplicate = recent.some((t) => t.toLowerCase() === topic.toLowerCase());
    if (!isDuplicate) return topic;
    console.log(`Mavzu takrorlandi ("${topic}"), qayta urinilmoqda...`);
  }
  return generateTopic(recent);
}

async function runDailyPost() {
  const workDir = __dirname;
  const imagePath = path.join(workDir, "_scheduler_frame.jpg");
  const audioPath = path.join(workDir, "_scheduler_voice.mp3");
  const videoPath = path.join(workDir, "_scheduler_post.mp4");

  try {
    console.log(`[${new Date().toISOString()}] Kunlik post boshlandi...`);

    const topic = await pickFreshTopic();
    console.log("Mavzu:", topic);

    const [caption, narration, imageBuffer] = await Promise.all([
      generatePostText(topic),
      generateNarrationScript(topic),
      generateImage(topic),
    ]);

    const quality = checkPostQuality(caption);
    if (!quality.ok) {
      console.error("Sifat-nazoratidan o'tmadi:", quality.reasons.join("; "));
      await bot.sendMessage(
        ADMIN_CHAT_ID,
        `⚠️ Kunlik post SIFAT-NAZORATIDAN O'TMADI, kanalga JOYLANMADI.\n\n` +
          `Mavzu: ${topic}\n\nSabablar:\n- ${quality.reasons.join("\n- ")}\n\n` +
          `Tayyor matn:\n${caption}\n\n` +
          `Kerak bo'lsa /auto orqali qo'lda qayta urinib ko'ring.`,
      );
      return;
    }

    fs.writeFileSync(imagePath, imageBuffer);
    await generateVoice(narration, audioPath);
    await buildVideo(imagePath, audioPath, videoPath);

    const safeCaption = truncateCaption(escapeHtml(caption));
    await bot.sendVideo(CHANNEL, videoPath, { caption: safeCaption, parse_mode: "HTML" });

    saveTopic(topic);
    console.log("Kanalga muvaffaqiyatli joylandi.");
    await bot.sendMessage(ADMIN_CHAT_ID, `✅ Kunlik post joylandi.\n\nMavzu: ${topic}`);
  } catch (error) {
    console.error("Kunlik post xatosi:", error);
    try {
      await bot.sendMessage(ADMIN_CHAT_ID, "⚠️ Kunlik avtomatik post xato bilan tugadi: " + error.message);
    } catch (_) {}
    process.exitCode = 1;
  } finally {
    for (const f of [imagePath, audioPath, videoPath]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
}

runDailyPost();
