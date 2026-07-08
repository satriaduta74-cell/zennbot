
require("dotenv").config();
const { Telegraf } = require("telegraf");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== OWNER CONFIG =====
const OWNER_ID = process.env.OWNER_ID;

// ===== LOAD ACCESS LIST =====
const ACCESS_FILE = "./access.json";
let accessList = [];

if (fs.existsSync(ACCESS_FILE)) {
  accessList = JSON.parse(fs.readFileSync(ACCESS_FILE));
}

function saveAccess() {
  fs.writeFileSync(ACCESS_FILE, JSON.stringify(accessList, null, 2));
}

function isOwner(id) {
  return id.toString() === OWNER_ID;
}

function hasAccess(id) {
  return isOwner(id) || accessList.includes(id.toString());
}

// ===== GEMINI AI SETUP =====
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ===== MENU FUNCTION =====
async function sendMenu(ctx) {
  const message = `
\`\`\`
AI Telegram System Protokol 
Engine : 𝐖𝐎𝐑𝐌 𝐆𝐏𝐓
Access Control : Enabled
Owner : ${OWNER_ID}

Commands:
/menu
/addakses [id]
/delakses [id]

Send text to chat with AI.
\`\`\`
`;

  await ctx.reply(message, { parse_mode: "Markdown" });
}

// ===== START & MENU =====
bot.start(async (ctx) => {
  await sendMenu(ctx);
});

bot.command("menu", async (ctx) => {
  await sendMenu(ctx);
});

// ===== ADD ACCESS =====
bot.command("addakses", async (ctx) => {
  if (!isOwner(ctx.from.id)) {
    return ctx.reply("❌ Only owner can add access.");
  }

  const args = ctx.message.text.split(" ");
  const target = args[1];

  if (!target) return ctx.reply("Format: /addakses [telegram_id]");

  if (!accessList.includes(target)) {
    accessList.push(target);
    saveAccess();
    ctx.reply("✅ Access added.");
  } else {
    ctx.reply("⚠️ User already has access.");
  }
});

// ===== DELETE ACCESS =====
bot.command("delakses", async (ctx) => {
  if (!isOwner(ctx.from.id)) {
    return ctx.reply("❌ Only owner can delete access.");
  }

  const args = ctx.message.text.split(" ");
  const target = args[1];

  if (!target) return ctx.reply("Format: /delakses [telegram_id]");

  accessList = accessList.filter(id => id !== target);
  saveAccess();
  ctx.reply("✅ Access removed.");
});

// ===== AI HANDLER =====
bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;

  if (!hasAccess(ctx.from.id)) {
    return ctx.reply("❌ Butuh akses ke owner");
  }

  try {
    const result = await model.generateContent(text);
    const response = result.response.text();
    await ctx.reply(response);
  } catch (error) {
    console.error(error);
    await ctx.reply("⚠️ API BOT NYA SUDAH LIMIT MOHON GANTI API LAGI");
  }
});

bot.launch();
console.log("🚀 AI Telegram Bot WORMGPT Running...");
