const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const OWNER_ID = '8592033747492364';

// ===== GLOBAL STATES =====
global.aiEnabled = global.aiEnabled ?? true;
global.aiModel = global.aiModel ?? 'copilot';

// ===== MEMORY =====
const memory = new Map();
const MAX_MEMORY = 10;

// ===== PAGINATION (HEADER ONLY PAGE 1) =====
function paginate(text, model, max = 1800) {
  const pages = [];
  let buffer = '';

  for (const line of text.split('\n')) {
    if ((buffer + line).length > max) {
      pages.push(buffer);
      buffer = '';
    }
    buffer += line + '\n';
  }

  if (buffer) pages.push(buffer);

  return pages.map((page, i) => {
    if (i === 0) {
      return (
`💬 | Anime Focus AI
🧠 Model: ${model.toUpperCase()}
・────────────・

${page}`
      );
    }
    return page;
  });
}

// ===== IMAGE FROM REPLY =====
async function getReplyImage(event, token) {
  const mid = event?.message?.reply_to?.mid;
  if (!mid) return null;

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/${mid}/attachments`,
      { params: { access_token: token } }
    );

    return data?.data?.[0]?.image_data?.url || null;
  } catch {
    return null;
  }
}

// ===== CONTEXT =====
function buildContext(senderId, question) {
  const hist = memory.get(senderId) || [];
  let ctx = '';

  for (const h of hist) {
    ctx += `User: ${h.q}\nAI: ${h.a}\n`;
  }

  return ctx + `User: ${question}\nAI:`;
}

// ===== SAVE MEMORY =====
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

    /* ===== AI ON / OFF ===== */
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

    /* ===== SWITCH MODEL ===== */
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

    /* ===== AI DISABLED ===== */
    if (!global.aiEnabled && senderId !== OWNER_ID) {
      return sendMessage(
        senderId,
        { text: '🚫 AI disabled by owner.' },
        pageAccessToken
      );
    }

    /* ===== RESET ===== */
    if (args[0] === 'reset') {
      memory.delete(senderId);
      return sendMessage(senderId, { text: '🧠 Memory cleared.' }, pageAccessToken);
    }

    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(senderId, { text: '⚠️ Usage: ai <question>' }, pageAccessToken);
    }

    await sendMessage(senderId, { text: '' }, pageAccessToken);

    try {
      const imageUrl = await getReplyImage(event, pageAccessToken);
      const prompt = buildContext(senderId, question);

      let response;
      let usedModel = global.aiModel;

      /* ===== COPILOT (NEKOLABS) ===== */
      if (global.aiModel === 'copilot') {
        try {
          const { data } = await axios.get(
            'https://api.nekolabs.web.id/text.gen/copilot',
            { params: { text: prompt } }
          );

          if (data?.success && data?.result?.text) {
            response = data.result.text.trim();
          }
        } catch {}
      }

      /* ===== GEMINI FALLBACK ===== */
      if (!response) {
        usedModel = 'gemini';

        const { data } = await axios.get(
          'https://api.nekolabs.web.id/text.gen/gemini/2.5-pro',
          {
            params: {
              text: prompt,
              imageUrl: imageUrl || undefined,
              sessionId: senderId
            }
          }
        );

        if (!data?.success || !data?.result) {
          throw new Error('All models failed');
        }

        response = data.result.trim();
      }

      saveMemory(senderId, question, response);

      const pages = paginate(response, usedModel);

      for (let i = 0; i < pages.length; i++) {
        let msg = pages[i];

        if (pages.length > 1) {
          msg += `\n📄 (${i + 1}/${pages.length})`;
        }

        msg += '\n・──── >ᴗ< ─────・';

        await sendMessage(senderId, { text: msg }, pageAccessToken);
      }

    } catch (err) {
      console.error('AI ERROR:', err.message);
      await sendMessage(
        senderId,
        { text: '❌ AI failed. Try later.' },
        pageAccessToken
      );
    }
  }
};
