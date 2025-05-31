import { Telegraf } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

async function isMember(ctx) {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: CHANNEL_ID,
        user_id: ctx.from.id
      }
    });
    const status = res.data?.result?.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch {
    return false;
  }
}

bot.start(async (ctx) => {
  const allowed = await isMember(ctx);
  if (!allowed) return ctx.reply(`🔒 Join ${CHANNEL_ID} first.`);
  ctx.reply(`👋 Welcome!\nUse /connect <number> to get your code.`);
});

bot.command('connect', async (ctx) => {
  const allowed = await isMember(ctx);
  if (!allowed) return ctx.reply(`🔒 Join ${CHANNEL_ID} first.`);
  const input = ctx.message.text.split(" ");
  if (input.length !== 2) return ctx.reply("❗ Usage: /connect <number>");

  const number = input[1];
  try {
    const res = await axios.get(`https://free-bots-new-dexter-family.vercel.app/api/getCode?number=${number}`);
    const code = res.data?.code;
    if (!code) return ctx.reply("No code received.");
    ctx.reply(`Code: \`${code}\``, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📋 Copy', callback_data: `copy_${code}` }]]
      }
    });
  } catch {
    ctx.reply("Failed to fetch code.");
  }
});

bot.on('callback_query', async (ctx) => {
  const code = ctx.callbackQuery.data.split('_')[1];
  await ctx.answerCbQuery("Copied (simulated)");
  await ctx.reply(`Manual copy:\n\`${code}\``, { parse_mode: 'Markdown' });
});

bot.launch();
