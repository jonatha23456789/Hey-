const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Découpe texte si trop long
function splitMessage(text, maxLength = 1900) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

module.exports = {
  name: 'ai',
  description: 'Answer to questions using GPT-OSS-120B',
  usage: '-ai <your question>',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {
    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-ai <your question>' },
        pageAccessToken
      );
    }

    // ⏳ petit feedback
    await sendMessage(senderId, { text: '🤖 Thinking...' }, pageAccessToken);

    try {
      const apiUrl =
        `https://api.nekolabs.web.id/txt.gen/cf/gpt-oss-120b?text=${encodeURIComponent(question)}`;

      const { data } = await axios.get(apiUrl);

      if (!data?.success || !data?.result?.response) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to get a response from AI.' },
          pageAccessToken
        );
      }

      const aiResponse = data.result.response.trim();

      const header = '💬 | Anime Focus AI\n・────────────・';
      const footer = '\n・──── >ᴗ< ─────・';

      const chunks = splitMessage(aiResponse);

      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1;

        let message = chunks[i];
        if (isFirst) message = header + '\n' + message;
        if (isLast) message = message + footer;

        await sendMessage(senderId, { text: message }, pageAccessToken);
      }

    } catch (error) {
      console.error('AI Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while contacting the AI API.' },
        pageAccessToken
      );
    }
  }
};
