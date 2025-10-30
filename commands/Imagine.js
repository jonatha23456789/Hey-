const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an AI image using Nekolabs API.',
  usage: '-imagine <prompt>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nExample: -imagine anime girl with sword' },
        pageAccessToken
      );
    }

    const apiUrl = `https://api.nekolabs.web.id/ai/imagen/4?prompt=${encodeURIComponent(prompt)}&ratio=1%3A1`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.success || !data.result) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image. Please try again later.' },
          pageAccessToken
        );
      }

      // Envoi du message d’information
      await sendMessage(
        senderId,
        { text: `✨ *AI Image Created!*\n🎨 Prompt: ${prompt}\n🕒 Response Time: ${data.responseTime || 'N/A'}` },
        pageAccessToken
      );

      // Envoi de l’image générée
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: data.result,
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
        { text: '🚨 An error occurred while generating the image. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
