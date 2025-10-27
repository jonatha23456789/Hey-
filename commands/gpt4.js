const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt4',
  description: 'Interact with GPT-4 via Miko API',
  usage: '-gpt4 <your message>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a question.\nUsage: -gpt4 <your question>' },
        pageAccessToken
      );
    }

    const apiUrl = `https://miko-utilis.vercel.app/api/gpt-4?query=${encodeURIComponent(prompt)}&userId=${senderId}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.status || !data.data?.response) {
        return sendMessage(
          senderId,
          { text: '❌ No response from the API.' },
          pageAccessToken
        );
      }

      const reply = data.data.response;

      // Si la réponse est trop longue, on la découpe
      const maxLength = 1900;
      for (let i = 0; i < reply.length; i += maxLength) {
        await sendMessage(
          senderId,
          { text: reply.slice(i, i + maxLength) },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error('GPT4 Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '🚨 An error occurred while contacting the GPT-4 API.' },
        pageAccessToken
      );
    }
  }
};
