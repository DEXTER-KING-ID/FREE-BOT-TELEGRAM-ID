import { Telegraf } from 'telegraf';
import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const bot = new Telegraf(BOT_TOKEN);

async function isMember(ctx) {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: CHANNEL_ID,
        user_id: ctx.from.id
      }
    });
    const status = res.data?.result?.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (err) {
    return false;
  }
}

bot.start(async (ctx) => {
  const allowed = await isMember(ctx);
  if (!allowed) {
    return ctx.reply(`🔒 Bot භාවිතා කිරීමට, කරුණාකර ${CHANNEL_ID} චැනලයට join වන්න.`);
  }

  ctx.reply(`👋 හෙලෝ ${ctx.from.first_name}!\n\n*ඔබට /connect <number> ලෙස ඔබේ WhatsApp අංකය ලබා දී Bot එකට සම්බන්ධ විය හැක.*`, {
    parse_mode: 'Markdown'
  });
});

bot.command('connect', async (ctx) => {
  const allowed = await isMember(ctx);
  if (!allowed) {
    return ctx.reply(`🔒 Bot භාවිතා කිරීමට, කරුණාකර ${CHANNEL_ID} චැනලයට join වන්න.`);
  }

  const input = ctx.message.text.split(" ");
  if (input.length !== 2) {
    return ctx.reply("⚠️ කරුණාකර නිවැරදි ලෙස /connect <whatsapp_number> ලෙස ඇතුළත් කරන්න.");
  }

  const number = input[1];
  try {
    const res = await axios.get(`https://free-bots-new-dexter-family.vercel.app/api/getCode?number=${number}`);
    const code = res.data?.code;

    if (!code) {
      return ctx.reply("❌ කේතය ලබා ගැනීමට නොහැකි විය.");
    }

    ctx.reply(`✅ ඔබේ *code* එක: \`${code}\``, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Copy Code", callback_data: `copy_${code}` }]
        ]
      }
    });
  } catch (err) {
    ctx.reply("🚫 දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න.");
  }
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith('copy_')) {
    const code = data.split('_')[1];
    await ctx.answerCbQuery(`✅ Code "${code}" copied (simulated)!`);
    await ctx.reply(`📋 Copy manually:\n\`${code}\``, { parse_mode: 'Markdown' });
  }
});

export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('ok');
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
