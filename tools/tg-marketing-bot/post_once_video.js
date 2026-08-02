require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);
const TelegramBot = require("node-telegram-bot-api");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const CHANNEL = process.env.CHANNEL;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const TTS_VOICE = "uz-UZ-SardorNeural";

// ffmpeg PATH'ga hali qo'shilmagan bo'lishi mumkin - toliq yo'lni ham sinab ko'ramiz
const FFMPEG_FALLBACK = "C:/Users/User/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe";
async function resolveFfmpeg() {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return "ffmpeg";
  } catch {
    return FFMPEG_FALLBACK;
  }
}

async function askGroq(prompt, maxTokens) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
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

async function generateImage(topic) {
  const prompt = `Flat illustration style image about: ${topic}. Related to Telegram e-commerce shop, small business owner in Uzbekistan, modern minimalist design, no text on image, soft blue and white color palette, highly detailed, professional marketing illustration, vibrant colors`;
  const url = `https://router.huggingface.co/hf-inference/models/${HF_IMAGE_MODEL}`;
  const doRequest = () =>
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${HF_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { num_inference_steps: 8, width: 1024, height: 1024 } }),
    });

  let response = await doRequest();
  for (let attempt = 0; attempt < 3 && response.status === 503; attempt++) {
    const info = await response.json().catch(() => ({}));
    const waitMs = Math.min((info.estimated_time || 20) * 1000, 30000);
    console.log(`Rasm modeli yuklanmoqda, ${Math.round(waitMs / 1000)}s kutilmoqda...`);
    await new Promise((r) => setTimeout(r, waitMs));
    response = await doRequest();
  }
  if (!response.ok) throw new Error(`Hugging Face API xatosi (${response.status}): ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

// Ovoz uchun matnni tozalash - emoji, hashtag va @mention narratsiyaga kerak emas
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

async function buildVideo(imagePath, audioPath, outPath) {
  const ffmpeg = await resolveFfmpeg();
  await execFileAsync(ffmpeg, [
    "-y",
    "-loop", "1",
    "-i", imagePath,
    "-i", audioPath,
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-c:a", "aac",
    "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-shortest",
    outPath,
  ]);
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

  console.log("Rasm generatsiya qilinmoqda (Hugging Face)...");
  const imageBuffer = await generateImage(topic);
  const imagePath = path.join(workDir, "_tmp_frame.jpg");
  fs.writeFileSync(imagePath, imageBuffer);
  console.log("Rasm tayyor,", imageBuffer.length, "bayt");

  console.log("Ovoz generatsiya qilinmoqda (Microsoft Edge TTS, o'zbekcha)...");
  const audioPath = path.join(workDir, "_tmp_voice.mp3");
  await generateVoice(textForNarration(caption), audioPath);
  console.log("Ovoz tayyor,", fs.statSync(audioPath).size, "bayt");

  console.log("Video yig'ilmoqda (ffmpeg)...");
  const videoPath = path.join(workDir, "_tmp_post.mp4");
  await buildVideo(imagePath, audioPath, videoPath);
  console.log("Video tayyor,", fs.statSync(videoPath).size, "bayt");

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  console.log(`Kanalga yuborilmoqda: ${CHANNEL} ...`);
  await bot.sendVideo(CHANNEL, videoPath, { caption, parse_mode: "HTML" });
  console.log("Muvaffaqiyatli joylandi!");

  fs.unlinkSync(imagePath);
  fs.unlinkSync(audioPath);
  fs.unlinkSync(videoPath);
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
