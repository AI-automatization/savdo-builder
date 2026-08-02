const fs = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const TTS_VOICE = "uz-UZ-SardorNeural";

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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`Groq API xatosi (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq javobi kutilgan formatda emas: " + JSON.stringify(data));
  return text.trim();
}

async function generateTopic(avoidTopics = []) {
  const avoidBlock = avoidTopics.length
    ? `\n\nOxirgi kunlarda bu mavzular allaqachon ishlatilgan - ularni va ularga juda o'xshash mavzularni TAKRORLAMA:\n${avoidTopics.map((t) => `- ${t}`).join("\n")}`
    : "";
  return askGroq(
    `Sen Maxsavdo (Telegram-do'kon konstruktori, O'zbekiston) uchun kontent-menejersan.
Telegram kanali uchun bitta yangi, qiziqarli post mavzusini o'ylab top (tadbirkorlik, onlayn savdo, mijozlar bilan ishlash kabi mavzular atrofida).
Faqat mavzuni bitta qisqa jumla bilan qaytar - tirnoqsiz, izohsiz, boshqa hech narsa yozma.${avoidBlock}`,
    60,
  );
}

// Kanalga chiqishdan oldingi avtomatik sifat-nazorati (critique-gate).
// Nazoratsiz (scheduler.js) yo'lda AI matni to'g'ridan-to'g'ri joylanmasdan oldin shu tekshiruvdan o'tadi.
const FORBIDDEN_PHRASES = [
  "multi-do'kon",
  "multi do'kon",
  "ko'p do'kon",
  "mobil ilova",
  "mobile app",
  "eng yaxshi",
  "dunyodagi eng",
  "raqobatchisiz",
];

function checkPostQuality(caption) {
  const reasons = [];
  const lower = caption.toLowerCase();

  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) reasons.push(`Taqiqlangan ibora topildi: "${phrase}"`);
  }
  if (!lower.includes("@maxsavdo_bot")) reasons.push("CTA (@maxsavdo_bot) yo'q");
  if (caption.trim().length < 40) reasons.push("Matn juda qisqa (40 belgidan kam)");
  if (!/#\w+/.test(caption)) reasons.push("Hashtag yo'q");

  return { ok: reasons.length === 0, reasons };
}

// Yozma post matni (Telegram caption, hashtag va emoji bilan)
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

// Ovoz uchun alohida, tabiiy so'zlashuv uslubidagi skript (caption'dan mustaqil)
async function generateNarrationScript(topic) {
  return askGroq(
    `Sen Maxsavdo (Telegram-do'kon konstruktori, O'zbekiston) botining ovozli prezentatorisan.
Quyidagi mavzu bo'yicha 15-20 soniyalik tabiiy, so'zlashuv uslubidagi ovozli xabar matnini yoz - xuddi odam kamera oldida gapirayotgandek.

Mavzu: "${topic}"

Qoidalar:
- O'zbek tilida, tabiiy va samimiy ohangda yoz
- Hashtag, emoji, belgilar ishlatma - bu faqat OVOZ uchun, ular o'qib bo'lmaydi
- 2-3 ta qisqa gap, oddiy va tushunarli
- Oxirida @maxsavdo_bot ga tabiiy tarzda taklif qil
- Multi-do'kon yoki mobil ilova haqida va'da berma - bular hali yo'q
- Faqat tayyor matnni qaytar, boshqa izohsiz`,
    300,
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
    await new Promise((r) => setTimeout(r, waitMs));
    response = await doRequest();
  }
  if (!response.ok) throw new Error(`Hugging Face API xatosi (${response.status}): ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
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

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncateCaption(text, max = 1024) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

module.exports = {
  generateTopic,
  generatePostText,
  generateNarrationScript,
  generateImage,
  generateVoice,
  buildVideo,
  escapeHtml,
  truncateCaption,
  checkPostQuality,
};
