// ADMIN_CHAT_ID ni aniqlash uchun kichik yordamchi.
//
// Ishlatish:
//   1. .env da TELEGRAM_BOT_TOKEN ni to'ldiring
//   2. Telegram'da o'z botingizni oching va unga istalgan xabar yozing (masalan: salom)
//   3. node get_chat_id.js
//
// Skript botga kelgan oxirgi xabarlarni o'qib, kim yozganini va chat ID'sini chiqaradi.
// Chiqqan raqamni .env dagi ADMIN_CHAT_ID ga qo'ying.
//
// Eslatma: telegram.js (polling rejimida) ishlab turgan bo'lsa, uni avval to'xtating —
// bitta bot tokenini ikki joyda bir vaqtda o'qib bo'lmaydi (409 Conflict).

require("dotenv").config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("Xato: .env faylida TELEGRAM_BOT_TOKEN to'ldirilmagan.");
  process.exit(1);
}

async function main() {
  const meResponse = await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`);
  const me = await meResponse.json();
  if (!me.ok) {
    console.error("Token noto'g'ri ko'rinadi. Telegram javobi:", me.description);
    process.exit(1);
  }
  console.log(`Bot: @${me.result.username} (${me.result.first_name})\n`);

  const updatesResponse = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
  const updates = await updatesResponse.json();
  if (!updates.ok) {
    console.error("getUpdates xatosi:", updates.description);
    process.exit(1);
  }

  const chats = new Map();
  for (const update of updates.result) {
    const message = update.message || update.channel_post || update.my_chat_member;
    const chat = message?.chat;
    if (chat) chats.set(chat.id, chat);
  }

  if (chats.size === 0) {
    console.log("Hech qanday xabar topilmadi.");
    console.log(`Telegram'da @${me.result.username} botini oching, Start bosing va istalgan`);
    console.log("xabar yozing — keyin shu skriptni qayta ishga tushiring.");
    console.log("\nEslatma: agar webhook o'rnatilgan bo'lsa, getUpdates bo'sh qaytadi.");
    return;
  }

  console.log("Topilgan chatlar:\n");
  for (const chat of chats.values()) {
    const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.title || "-";
    const username = chat.username ? `@${chat.username}` : "-";
    console.log(`  chat_id: ${chat.id}`);
    console.log(`  turi:    ${chat.type}`);
    console.log(`  kim:     ${name}  ${username}\n`);
  }
  console.log("Shaxsiy chatingiz (turi: private) ID'sini .env dagi ADMIN_CHAT_ID ga qo'ying.");
}

main().catch((error) => {
  console.error("Xato:", error.message);
  process.exit(1);
});
