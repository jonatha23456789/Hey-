const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

function splitMessage(text, maxLength = 1900) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

module.exports = {
  name: 'ai',
  description: 'Answer to questions',
  usage: '-ai <your question>',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(senderId, { text: '⚠️ Please provide a question.\nUsage: -ai <your question>' }, pageAccessToken);
    }

    // Message de chargement
    await sendMessage(senderId, { text: '💬 Asking Anime Focus AI, please wait...' }, pageAccessToken);

    try {
      const encodedQuestion = encodeURIComponent(question);
      const apiUrl = `https://api.nekolabs.web.id/text-generation/gpt/4.1-nano?text=${encodedQuestion}&imageUrl=https%3A%2F%2Fapi.nekolabs.web.id%2Fali-oss%2Fv1%2Fnekoo_1765675310661.jpg&sessionId=61554245590654`;

      const { data } = await axios.get(apiUrl);

      if (!data.success || !data.result) {
        return sendMessage(senderId, { text: '❌ Failed to get a response from AI.' }, pageAccessToken);
      }

      let aiResponse = data.result.trim();

      const header = '💬 | Anime Focus Ai\n・────────────・';
      const footer = '\n・──── >ᴗ< ─────・';

      const chunks = splitMessage(aiResponse);

      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1;

        let fullMessage = chunks[i];
        if (isFirst) fullMessage = header + '\n' + fullMessage;
        if (isLast) fullMessage = fullMessage + footer;

        await sendMessage(senderId, { text: fullMessage }, pageAccessToken);
      }

    } catch (error) {
      console.error('AI Command Error:', error.message || error);
      await sendMessage(senderId, { text: '❌ An error occurred while contacting the AI API.' }, pageAccessToken);
    }
  }
};
