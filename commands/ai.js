const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const OWNER_ID = '61554245590654'; // 🔒 TON ID

// 🔁 État global AI
global.aiEnabled = global.aiEnabled ?? true;

// 🧠 Mémoire RAM
const memory = new Map();
const MAX_MEMORY = 10;

// ✂️ Découpe Messenger
function splitMessage(text, max = 1900) {
  const arr = [];
  for (let i = 0; i < text.length; i += max) {
    arr.push(text.slice(i, i + max));
  }
  return arr;
}

// 📸 Image depuis reply
async function getReplyImage(event, pageAccessToken) {
  const mid = event?.message?.reply_to?.mid;
  if (!mid) return null;

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/${mid}/attachments`,
      { params: { access_token: pageAccessToken } }
    );

    return (
      data?.data?.[0]?.image_data?.url ||
      data?.data?.[0]?.file_url ||
      null
    );
  } catch {
    return null;
  }
}

// 🧠 Contexte mémoire
function buildContext(senderId, question) {
  const hist = memory.get(senderId) || [];
  let ctx = '';

  for (const h of hist) {
    ctx += `User: ${h.q}\nAI: ${h.a}\n`;
  }

  ctx += `User: ${question}\nAI:`;
  return ctx;
}

// 💾 Sauvegarde mémoire
function saveMemory(senderId, q, a) {
  const hist = memory.get(senderId) || [];
  hist.push({ q, a });
  if (hist.length > MAX_MEMORY) hist.shift();
  memory.set(senderId, hist);
}

module.exports = {
  name: 'ai',
  description: 'AI with ON/OFF + memory + image vision',
  usage: '-ai <question> | -ai on | -ai off | -ai reset',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    /* =====================
       🔐 AI ON / OFF
       ===================== */
    if (['on', 'off'].includes(args[0])) {
      if (senderId !== OWNER_ID) {
        return sendMessage(
          senderId,
          { text: '❌ You are not allowed to control AI status.' },
          pageAccessToken
        );
      }

      global.aiEnabled = args[0] === 'on';

      return sendMessage(
        senderId,
        {
          text: global.aiEnabled
            ? '✅ AI is now ENABLED for everyone.'
            : '🚫 AI is now DISABLED (owner only).'
        },
        pageAccessToken
      );
    }

    /* =====================
       🚫 AI OFF → OWNER ONLY
       ===================== */
    if (!global.aiEnabled && senderId !== OWNER_ID) {
      return sendMessage(
        senderId,
        { text: '🚫 AI is currently disabled by the owner.' },
        pageAccessToken
      );
    }

    /* =====================
       🔁 RESET MÉMOIRE
       ===================== */
    if (args[0]?.toLowerCase() === 'reset') {
      memory.delete(senderId);
      return sendMessage(
        senderId,
        { text: '🧠 Conversation memory cleared.' },
        pageAccessToken
      );
    }

    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-ai <question>\n-ai on/off\n-ai reset' },
        pageAccessToken
      );
    }

    await sendMessage(senderId, { text: '' }, pageAccessToken);

    try {
      const imageUrl = await getReplyImage(event, pageAccessToken);
      const prompt = buildContext(senderId, question);

      let aiResponse = null;
      let modelUsed = 'GPT-5-nano';

      /* ===== GPT ===== */
      try {
        const gpt = await axios.get(
          'https://api.nekolabs.web.id/txt.gen/gpt/5-nano',
          {
            params: {
              text: prompt,
              imageUrl: imageUrl || undefined,
              sessionId: senderId
            },
            timeout: 20000
          }
        );

        if (gpt.data?.success && gpt.data?.result) {
          aiResponse = gpt.data.result.trim();
        }
      } catch {}

      /* ===== FALLBACK GEMINI ===== */
      if (!aiResponse) {
        modelUsed = 'Gemini 2.5 Pro';

        const gemini = await axios.get(
          'https://api.nekolabs.web.id/text.gen/gemini/2.5-pro',
          {
            params: {
              text: prompt,
              systemPrompt: 'You are a helpful assistant',
              imageUrl: imageUrl || undefined,
              sessionId: senderId
            },
            timeout: 30000
          }
        );

        if (!gemini.data?.success || !gemini.data?.result) {
          throw new Error('All AI models failed');
        }

        aiResponse = gemini.data.result.trim();
      }

      saveMemory(senderId, question, aiResponse);

      const header =
`💬 | Anime Focus AI
🧠 Model: ${modelUsed}
・────────────・`;

      const footer = '\n・──── >ᴗ< ─────・';

      for (const chunk of splitMessage(aiResponse)) {
        await sendMessage(senderId, {
          text: header + '\n' + chunk + footer
        }, pageAccessToken);
      }

    } catch (err) {
      console.error('AI ERROR:', err.message);
      await sendMessage(
        senderId,
        { text: '❌ AI failed. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
