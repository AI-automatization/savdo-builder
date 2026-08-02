require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHANNEL = process.env.CHANNEL;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const TTS_VOICE = "uz-UZ-SardorNeural";
const PRESENTER_IMAGE = path.join(__dirname, "presenter.jpg");
const WAV2LIP_SPACE = "fatma812/Wav2lip-ZeroGPU2"; // bepul, ochiq Gradio Space

async function askGroq(prompt, maxTokens) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`Groq API xatosi (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq javobi kutilgan formatda emas: " + JSON.stringify(data));
  return text.trim();
}

async function generateTopic() {
  return askGroq(
    `Sen Maxsavdo (Telegram-do'kon konstruktori, O'zbekiston) uchun kontent-menejersan.
Telegram kanali uchun bitta yangi, qiziqarli post mavzusini o'ylab top (tadbirkorlik, onlayn savdo, mijozlar bilan ishlash kabi mavzular atrofida).
Faqat mavzuni bitta qisqa jumla bilan qaytar - tirnoqsiz, izohsiz, boshqa hech narsa yozma.`,
    60,
  );
}

async function generatePostText(topic) {
  return askGroq(
    `Sen Maxsavdo (Telegram-do'kon konstruktori, O'zbekiston) uchun marketing mutaxassisisan.
Quyidagi mavzu bo'yicha Telegram kanali uchun qisqa, jozibali post matni yoz.

Mavzu: "${topic}"

Qoidalar:
- O'zbek tilida yoz
- 4-6 qator, emoji bilan
- Oxirida @maxsavdo_bot ga chaqiruv bo'lsin
- Multi-do'kon yoki mobil ilova haqida va'da berma - bular hali yo'q
- 5-6 ta mos hashtag qo'sh
- Faqat tayyor post matnini qaytar, boshqa izohsiz`,
    500,
  );
}

function textForNarration(caption) {
  return caption
    .replace(/#\S+/g, "")
    .replace(/@\S+/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateVoice(text, outPath) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on("data", (c) => chunks.push(c));
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });
  fs.writeFileSync(outPath, Buffer.concat(chunks));
}

async function generateTalkingVideo(imagePath, audioPath, outPath) {
  const { Client } = await import("@gradio/client");
  const client = await Client.connect(WAV2LIP_SPACE);
  const imageBlob = new Blob([fs.readFileSync(imagePath)], { type: "image/jpeg" });
  const audioBlob = new Blob([fs.readFileSync(audioPath)], { type: "audio/mpeg" });
  const result = await client.predict("/run_inference", {
    input_image: imageBlob,
    input_audio: audioBlob,
  });
  const url = result.data[0].video.url;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Video yuklab olishda xato (${r.status})`);
  fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()));
}

(async () => {
  const workDir = __dirname;

  console.log("Mavzu o'ylanmoqda (Groq)...");
  const topic = await generateTopic();
  console.log("Mavzu:", topic);

  console.log("Post matni yozilmoqda (Groq)...");
  const caption = await generatePostText(topic);
  console.log("--- Post matni ---");
  console.log(caption);
  console.log("------------------");

  console.log("Ovoz generatsiya qilinmoqda (Microsoft Edge TTS, o'zbekcha)...");
  const audioPath = path.join(workDir, "_tmp_avatar_voice.mp3");
  await generateVoice(textForNarration(caption), audioPath);
  console.log("Ovoz tayyor,", fs.statSync(audioPath).size, "bayt");

  console.log("Gapiruvchi avatar video generatsiya qilinmoqda (Wav2Lip, bepul Space)...");
  const videoPath = path.join(workDir, "_tmp_avatar_video.mp4");
  await generateTalkingVideo(PRESENTER_IMAGE, audioPath, videoPath);
  console.log("Video tayyor,", fs.statSync(videoPath).size, "bayt");

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  console.log(`Kanalga yuborilmoqda: ${CHANNEL} ...`);
  await bot.sendVideo(CHANNEL, videoPath, { caption, parse_mode: "HTML" });
  console.log("Muvaffaqiyatli joylandi!");

  fs.unlinkSync(audioPath);
  fs.unlinkSync(videoPath);
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
