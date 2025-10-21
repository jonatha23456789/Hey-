const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an AI image using Aryan Chauhan API.',
  usage: '-imagine <prompt>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nExample: -imagine anime girl' },
        pageAccessToken
      );
    }

    const apiUrl = `https://arychauhann.onrender.com/api/xl?prompt=${encodeURIComponent(prompt)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || data.status !== 'success' || !data.url) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image. Please try again later.' },
          pageAccessToken
        );
      }

      // Envoi d'abord du message texte
      await sendMessage(
        senderId,
        { text: `✨ Image successfully created!\n🎨 Prompt: ${prompt}\n👤 Operator: ${data.operator}` },
        pageAccessToken
      );

      // Ensuite l'image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: data.url,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      return sendMessage(
        senderId,
        { text: '🚨 An error occurred while generating the image.' },
        pageAccessToken
      );
    }
  }
};
