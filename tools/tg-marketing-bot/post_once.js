require("dotenv").config({ path: "C:/Users/User/Desktop/Max_savdo_tg_bot/.env" });
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const CHANNEL = process.env.CHANNEL;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";

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

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API xatosi (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!text) {
    throw new Error("Groq javobi kutilgan formatda emas: " + JSON.stringify(data));
  }
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
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 8, width: 1024, height: 1024 },
      }),
    });

  let response = await doRequest();

  for (let attempt = 0; attempt < 3 && response.status === 503; attempt++) {
    const info = await response.json().catch(() => ({}));
    const waitMs = Math.min((info.estimated_time || 20) * 1000, 30000);
    console.log(`Rasm modeli yuklanmoqda, ${Math.round(waitMs / 1000)}s kutilmoqda...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    response = await doRequest();
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Hugging Face API xatosi (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

(async () => {
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
  console.log("Rasm tayyor,", imageBuffer.length, "bayt");

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  console.log(`Kanalga yuborilmoqda: ${CHANNEL} ...`);
  await bot.sendPhoto(CHANNEL, imageBuffer, {
    caption,
    parse_mode: "HTML",
  });
  console.log("Muvaffaqiyatli joylandi!");
})().catch((err) => {
  console.error("XATO:", err.message);
  process.exit(1);
});
