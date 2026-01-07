const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const OWNER_ID = '8592033747492364';

// 🔁 États globaux
global.aiEnabled = global.aiEnabled ?? true;
global.aiModel = global.aiModel ?? 'copilot';

// 🧠 Mémoire RAM
const memory = new Map();
const MAX_MEMORY = 10;

// ✂️ Split Messenger
function splitMessage(text, max = 1900) {
  const out = [];
  for (let i = 0; i < text.length; i += max) {
    out.push(text.slice(i, i + max));
  }
  return out;
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
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    /* =====================
       🔐 AI ON / OFF
       ===================== */
    if (['on', 'off'].includes(args[0])) {
      if (senderId !== OWNER_ID) {
        return sendMessage(senderId,
          { text: '❌ Owner only.' },
          pageAccessToken
        );
      }

      global.aiEnabled = args[0] === 'on';
      return sendMessage(senderId,
        { text: global.aiEnabled ? '✅ AI ENABLED' : '🚫 AI DISABLED' },
        pageAccessToken
      );
    }

    /* =====================
       🔀 SWITCH MODEL
       ===================== */
    if (args[0] === 'switch') {
      if (senderId !== OWNER_ID) {
        return sendMessage(senderId,
          { text: '❌ Owner only.' },
          pageAccessToken
        );
      }

      const model = args[1]?.toLowerCase();
      if (!['copilot', 'gemini'].includes(model)) {
        return sendMessage(senderId,
          { text: '⚠️ Usage: ai switch copilot | gemini' },
          pageAccessToken
        );
      }

      global.aiModel = model;
      return sendMessage(senderId,
        { text: `🔄 AI model switched to **${model.toUpperCase()}**` },
        pageAccessToken
      );
    }

    /* =====================
       🚫 AI OFF
       ===================== */
    if (!global.aiEnabled && senderId !== OWNER_ID) {
      return sendMessage(senderId,
        { text: '🚫 AI disabled by owner.' },
        pageAccessToken
      );
    }

    /* =====================
       🔁 RESET
       ===================== */
    if (args[0] === 'reset') {
      memory.delete(senderId);
      return sendMessage(senderId,
        { text: '🧠 Memory cleared.' },
        pageAccessToken
      );
    }

    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(senderId,
        { text: '⚠️ Usage: ai <question>' },
        pageAccessToken
      );
    }

    await sendMessage(senderId, { text: '🤖 Thinking...' }, pageAccessToken);

    try {
      const imageUrl = await getReplyImage(event, pageAccessToken);
      const prompt = buildContext(senderId, question);

      let response = null;
      let usedModel = global.aiModel;

      /* ===== COPILOT ===== */
      if (global.aiModel === 'copilot') {
        try {
          const { data } = await axios.get(
            'https://api-library-kohi.onrender.com/api/copilot',
            {
              params: {
                prompt,
                model: 'default',
                user: senderId
              },
              timeout: 25000
            }
          );

          if (data?.status && data?.data?.text) {
            response = data.data.text.trim();
          }
        } catch {}
      }

      /* ===== GEMINI (fallback ou switch) ===== */
      if (!response) {
        usedModel = 'gemini';

        const { data } = await axios.get(
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

        if (!data?.success || !data?.result) {
          throw new Error('All models failed');
        }

        response = data.result.trim();
      }

      saveMemory(senderId, question, response);

      const header =
`💬 | Anime Focus AI
🧠 Model: ${usedModel.toUpperCase()}
・────────────・`;

      const footer = '\n・──── >ᴗ< ─────・';

      for (const chunk of splitMessage(response)) {
        await sendMessage(senderId, {
          text: header + '\n' + chunk + footer
        }, pageAccessToken);
      }

    } catch (err) {
      console.error('AI ERROR:', err.message);
      await sendMessage(senderId,
        { text: '❌ AI failed. Try later.' },
        pageAccessToken
      );
    }
  }
};
