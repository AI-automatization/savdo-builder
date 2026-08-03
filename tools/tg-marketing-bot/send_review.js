// Tayyorlangan post qoralamalarini ko'rib chiqish uchun ADMIN chatga yuboradi (kanalga EMAS).
//
// Har bir post = ikkita fayl: `<nom>.json` (ichida `caption`) va `<nom>.mp4`.
//
// Ishlatish:
//   node send_review.js <content-papka> <video-papka>
//   node send_review.js "C:/.../maxsavdo-promo/content/daily" "C:/.../maxsavdo-promo/out/daily"

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!TOKEN || !ADMIN_CHAT_ID) {
  console.error("Xato: .env da TELEGRAM_BOT_TOKEN va ADMIN_CHAT_ID bo'lishi kerak.");
  process.exit(1);
}

const [contentDir, videoDir] = process.argv.slice(2);
if (!contentDir || !videoDir) {
  console.error("Ishlatish: node send_review.js <content-papka> <video-papka>");
  process.exit(1);
}

async function sendVideo(videoPath, caption) {
  const form = new FormData();
  form.append("chat_id", ADMIN_CHAT_ID);
  form.append("caption", caption);
  form.append("supports_streaming", "true");
  form.append(
    "video",
    new Blob([fs.readFileSync(videoPath)], { type: "video/mp4" }),
    path.basename(videoPath),
  );

  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, {
    method: "POST",
    body: form,
  });
  return response.json();
}

async function main() {
  const items = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (items.length === 0) {
    console.error(`${contentDir} ichida .json fayl topilmadi.`);
    process.exit(1);
  }

  for (const file of items) {
    const name = path.basename(file, ".json");
    const videoPath = path.join(videoDir, `${name}.mp4`);
    if (!fs.existsSync(videoPath)) {
      console.log(`${name}: video topilmadi (${videoPath}) — o'tkazib yuborildi`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf-8"));
    const caption = data.caption;
    if (!caption) {
      console.log(`${name}: json ichida "caption" yo'q — o'tkazib yuborildi`);
      continue;
    }
    if (caption.length > 1024) {
      console.log(`${name}: caption ${caption.length} belgi (limit 1024) — o'tkazib yuborildi`);
      continue;
    }

    const result = await sendVideo(videoPath, caption);
    console.log(
      result.ok
        ? `${name}: yuborildi (message_id ${result.result.message_id})`
        : `${name}: XATO — ${result.description}`,
    );
  }
}

main().catch((error) => {
  console.error("Xato:", error.message);
  process.exit(1);
});
