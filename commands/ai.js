const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const OWNER_ID = '8592033747492364';

// 🌍 États globaux
global.aiEnabled = global.aiEnabled ?? true;
global.aiModel = global.aiModel ?? 'copilot';

// 🧠 Mémoire RAM
const memory = new Map();
const MAX_MEMORY = 10;

// ✂️ Pagination Messenger
function paginate(text, max = 1800) {
  const pages = [];
  for (let i = 0; i < text.length; i += max) {
    pages.push(text.slice(i, i + max));
  }
  return pages;
}

// 🧠 Contexte
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

  async execute(senderId, args, pageAccessToken) {

    /* =====================
       🔐 AI ON / OFF
       ===================== */
    if (['on', 'off'].includes(args[0])) {
      if (senderId !== OWNER_ID) {
        return sendMessage(senderId, { text: '' }, pageAccessToken);
      }

      global.aiEnabled = args[0] === 'on';
      return sendMessage(
        senderId,
        { text: global.aiEnabled ? '✅ AI ENABLED' : '🚫 AI DISABLED' },
        pageAccessToken
      );
    }

    /* =====================
       🔀 SWITCH MODEL
       ===================== */
    if (args[0] === 'switch') {
      if (senderId !== OWNER_ID) {
        return sendMessage(senderId, { text: '' }, pageAccessToken);
      }

      const model = args[1]?.toLowerCase();
      if (!['copilot', 'gemini'].includes(model)) {
        return sendMessage(
          senderId,
          { text: '⚠️ Usage: ai switch copilot | gemini' },
          pageAccessToken
        );
      }

      global.aiModel = model;
      return sendMessage(
        senderId,
        { text: `🔄 AI switched to ${model.toUpperCase()}` },
        pageAccessToken
      );
    }

    /* =====================
       🚫 AI OFF
       ===================== */
    if (!global.aiEnabled && senderId !== OWNER_ID) {
      return sendMessage(
        senderId,
        { text: '🚫 AI disabled by owner.' },
        pageAccessToken
      );
    }

    /* =====================
       🔁 RESET
       ===================== */
    if (args[0] === 'reset') {
      memory.delete(senderId);
      return sendMessage(
        senderId,
        { text: '🧠 Memory cleared.' },
        pageAccessToken
      );
    }

    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage: ai <question>' },
        pageAccessToken
      );
    }

    await sendMessage(senderId, { text: '' }, pageAccessToken);

    try {
      const prompt = buildContext(senderId, question);
      let response;
      let usedModel = global.aiModel;

      /* =====================
         🧠 COPILOT (NEKOLABS)
         ===================== */
      if (global.aiModel === 'copilot') {
        const { data } = await axios.get(
          'https://api.nekolabs.web.id/text.gen/copilot',
          {
            params: { text: prompt },
            timeout: 30000
          }
        );

        if (!data?.success || !data?.result?.text) {
          throw new Error('Copilot failed');
        }

        response = data.result.text.trim();
      }

      /* =====================
         🌟 GEMINI (NEKOLABS)
         ===================== */
      if (global.aiModel === 'gemini') {
        const { data } = await axios.get(
          'https://api.nekolabs.web.id/text.gen/gemini/2.5-pro',
          {
            params: {
              text: prompt,
              sessionId: senderId
            },
            timeout: 30000
          }
        );

        if (!data?.success || !data?.result) {
          throw new Error('Gemini failed');
        }

        response = data.result.trim();
      }

      saveMemory(senderId, question, response);

      const header =
`💬 | Anime Focus AI
🧠 Model: ${usedModel.toUpperCase()}
・────────────・`;

      const footer = '・──── >ᴗ< ─────・';

      const pages = paginate(response);

      for (let i = 0; i < pages.length; i++) {
        let msg =
`${header}
${pages[i]}

${footer}`;

        if (pages.length > 1) {
          msg += `\n📄 (${i + 1}/${pages.length})`;
        }

        await sendMessage(senderId, { text: msg }, pageAccessToken);
      }

    } catch (err) {
      console.error('AI ERROR:', err.message);
      await sendMessage(
        senderId,
        { text: '❌ AI failed. Try again later.' },
        pageAccessToken
      );
    }
  }
};
