const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

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
    await sendMessage(senderId, { text: '💬 Asking AI, please wait...' }, pageAccessToken);

    try {
      // Encode la question pour l'URL
      const encodedQuestion = encodeURIComponent(question);
      const apiUrl = `https://api.nekolabs.web.id/text-generation/gpt/4.1-nano?text=${encodedQuestion}&imageUrl=https%3A%2F%2Fapi.nekolabs.web.id%2Fali-oss%2Fv1%2Fnekoo_1765675310661.jpg&sessionId=61554245590654`;

      const { data } = await axios.get(apiUrl);

      if (!data.success || !data.result) {
        return sendMessage(senderId, { text: '❌ Failed to get a response from AI.' }, pageAccessToken);
      }

      const answer = data.result;

      // Découpe le message si trop long
      const maxLength = 1900;
      for (let i = 0; i < answer.length; i += maxLength) {
        await sendMessage(senderId, { text: answer.slice(i, i + maxLength) }, pageAccessToken);
      }

    } catch (error) {
      console.error('AI Command Error:', error.message || error);
      await sendMessage(senderId, { text: '❌ An error occurred while contacting the AI API.' }, pageAccessToken);
    }
  }
};
