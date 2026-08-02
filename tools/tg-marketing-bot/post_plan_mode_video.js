require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const TTS_VOICE = "uz-UZ-SardorNeural";

const TOPIC = "Claude Plan Mode yordamida Max Savdo qanday rivojlantirilmoqda";

const CAPTION = `🤖 Max Savdo qanday quriladi, bilasizmi?

Har bir yangi funksiya avval to'g'ridan-to'g'ri kodga emas, balki AI bilan birgalikda tuzilgan "reja"ga asoslanadi — Claude Plan Mode yordamida. Avval butun jarayon rejalashtiriladi, xatoliklar oldindan aniqlanadi, va faqat shundan keyin amalga oshiriladi.

Natijada — tezroq, ishonchliroq va barqarorroq savdo boti! 🚀

O'z do'koningizni ochish uchun ➡️ @maxsavdo_bot

#MaxSavdo #TelegramBot #Tadbirkorlik #OnlaynSavdo #AI #Ozbekiston`;

const FFMPEG_FALLBACK = "C:/Users/User/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe";
async function resolveFfmpeg() {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return "ffmpeg";
  } catch {
    return FFMPEG_FALLBACK;
  }
}

async function generateImage(topic) {
  const prompt = `Flat illustration style image about: ${topic}. AI assistant planning steps on a screen, small business owner in Uzbekistan using Telegram e-commerce shop, modern minimalist design, no text on image, soft blue and white color palette, highly detailed, professional marketing illustration, vibrant colors`;
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

  console.log("Mavzu:", TOPIC);
  console.log("--- Post matni ---");
  console.log(CAPTION);
  console.log("------------------");

  console.log("Rasm generatsiya qilinmoqda (Hugging Face)...");
  const imageBuffer = await generateImage(TOPIC);
  const imagePath = path.join(workDir, "plan_mode_frame.jpg");
  fs.writeFileSync(imagePath, imageBuffer);
  console.log("Rasm tayyor:", imagePath);

  console.log("Ovoz generatsiya qilinmoqda (Microsoft Edge TTS, o'zbekcha)...");
  const audioPath = path.join(workDir, "plan_mode_voice.mp3");
  await generateVoice(textForNarration(CAPTION), audioPath);
  console.log("Ovoz tayyor:", audioPath);

  console.log("Video yig'ilmoqda (ffmpeg)...");
  const videoPath = path.join(workDir, "plan_mode_video.mp4");
  await buildVideo(imagePath, audioPath, videoPath);
  console.log("Video tayyor:", videoPath);

  fs.writeFileSync(path.join(workDir, "plan_mode_caption.txt"), CAPTION);
  console.log("\nTayyor! Kanalga joylashdan oldin faylni tekshiring: " + videoPath);
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
