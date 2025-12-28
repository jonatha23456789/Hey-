const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 🧠 Mémoire en RAM (par utilisateur)
const memory = new Map();
const MAX_MEMORY = 10;

// ✂️ Découpe texte Messenger
function splitMessage(text, maxLength = 1900) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

// 📸 Récupérer image depuis un reply (Graph API)
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
  } catch (err) {
    console.error('Reply image fetch error:', err.message);
    return null;
  }
}

// 🧠 Construire contexte mémoire
function buildContext(senderId, newQuestion) {
  const history = memory.get(senderId) || [];
  let context = '';

  for (const m of history) {
    context += `User: ${m.q}\nAI: ${m.a}\n`;
  }

  context += `User: ${newQuestion}\nAI:`;
  return context;
}

// 💾 Sauvegarder mémoire
function saveMemory(senderId, question, answer) {
  const history = memory.get(senderId) || [];
  history.push({ q: question, a: answer });

  if (history.length > MAX_MEMORY) history.shift();
  memory.set(senderId, history);
}

module.exports = {
  name: 'ai',
  description: 'AI with memory + image vision (GPT-5-nano)',
  usage: '-ai <question> | -ai reset',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    // 🔁 Reset mémoire
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
        { text: '⚠️ Usage:\n-ai <question>\n-ai reset' },
        pageAccessToken
      );
    }

    // ⏳ Feedback
    await sendMessage(senderId, { text: '' }, pageAccessToken);

    try {
      // 📸 image depuis reply (si existe)
      const imageUrl = await getReplyImage(event, pageAccessToken);

      // 🧠 prompt avec mémoire
      const promptWithMemory = buildContext(senderId, question);

      const { data } = await axios.get(
        'https://api.nekolabs.web.id/txt.gen/gpt/5-nano',
        {
          params: {
            text: promptWithMemory,
            imageUrl: imageUrl || undefined,
            sessionId: senderId
          }
        }
      );

      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to get a response from AI.' },
          pageAccessToken
        );
      }

      const aiResponse = data.result.trim();

      // 💾 sauvegarde mémoire
      saveMemory(senderId, question, aiResponse);

      const header = '💬 | Anime Focus AI\n・────────────・';
      const footer = '\n・──── >ᴗ< ─────・';

      const chunks = splitMessage(aiResponse);

      for (let i = 0; i < chunks.length; i++) {
        let msg = chunks[i];
        if (i === 0) msg = header + '\n' + msg;
        if (i === chunks.length - 1) msg += footer;

        await sendMessage(senderId, { text: msg }, pageAccessToken);
      }

    } catch (err) {
      console.error('AI Error:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ AI error occurred. Please try again.' },
        pageAccessToken
      );
    }
  }
};
