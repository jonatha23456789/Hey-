const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an image from a text prompt using AI (Seedream model)',
  usage: '-imagine <your prompt>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nUsage: -imagine <your idea>' },
        pageAccessToken
      );
    }

    const prompt = args.join(' ').trim();
    const apiUrl = `https://api-library-kohi.onrender.com/api/imagegen?prompt=${encodeURIComponent(prompt)}&model=seedream`;

    try {
      const { data } = await axios.get(apiUrl);

      // Détection automatique du champ contenant l’URL de l’image
      const imageUrl = data?.image_url || data?.url || data?.result || data?.data || null;

      if (!imageUrl) {
        console.error('Invalid API response:', data);
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image — no valid URL returned by the API.' },
          pageAccessToken
        );
      }

      // Envoi direct de l’image générée
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: imageUrl },
          },
        },
        pageAccessToken
      );

      // Envoi d’un petit message de confirmation avec le prompt
      await sendMessage(
        senderId,
        { text: `✨ Prompt used: ${prompt}` },
        pageAccessToken
      );

    } catch (error) {
      console.error('Imagine Command Error:', error.response?.data || error.message);
      await sendMessage(
        senderId,
        { text: '❌ Failed to create image. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
