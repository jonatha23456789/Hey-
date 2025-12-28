const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Découpe texte si trop long (limite Messenger)
function splitMessage(text, maxLength = 1900) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

module.exports = {
  name: ['gpt'],
  description: 'Chat with ChatGPT (Kohi API)',
  usage: '-gpt <question>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage: -gpt <your question>' },
        pageAccessToken
      );
    }

    // ⏳ feedback optionnel
    await sendMessage(senderId, { text: '' }, pageAccessToken);

    const apiUrl = 'https://api-library-kohi.onrender.com/api/chatgpt';

    try {
      const { data } = await axios.get(apiUrl, {
        params: {
          prompt,
          user: senderId
        }
      });

      if (!data?.status || !data?.data) {
        return sendMessage(
          senderId,
          { text: '❌ No response from GPT API.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';
      const reply =
`${deco}
💬 | GPT

${data.data}

${deco}`;

      const chunks = splitMessage(reply);

      for (const chunk of chunks) {
        await sendMessage(
          senderId,
          { text: chunk },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error('GPT Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '🚨 Error while contacting GPT API.' },
        pageAccessToken
      );
    }
  }
};
