const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: ['gpt'],
  description: 'Chat with GPT-4.1 nano (Nekolabs)',
  usage: '-gpt <question> (image optional)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, event, sendMessageFn, imageCache) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage: -gpt <your question>' },
        pageAccessToken
      );
    }

    // 🖼 Image optionnelle (dernière image envoyée)
    const imageUrl = imageCache?.get(senderId)?.url || '';

    const apiUrl = 'https://api.nekolabs.web.id/text-generation/gpt/4.1-nano';

    try {
      const { data } = await axios.get(apiUrl, {
        params: {
          text: prompt,
          imageUrl,
          sessionId: senderId
        }
      });

      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ No response from GPT API.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';
      const reply =
`${deco}
💬 | GPT-4.1

${data.result}

${deco}`;

      // Découpage si trop long (Messenger limit)
      const maxLength = 1900;
      for (let i = 0; i < reply.length; i += maxLength) {
        await sendMessage(
          senderId,
          { text: reply.slice(i, i + maxLength) },
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
