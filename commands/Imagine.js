const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create image using AI generator',
  usage: '-imagine <prompt>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nUsage: -imagine <your idea>' },
        pageAccessToken
      );
    }

    const prompt = encodeURIComponent(args.join(' '));
    const apiUrl = `https://api-library-kohi.onrender.com/api/imagegen?prompt=${prompt}&model=nanobanana`;

    try {
      const { data } = await axios.get(apiUrl);

      // Vérifie si l’API a renvoyé une URL d’image
      const imageUrl =
        data?.image_url || data?.url || data?.result || data?.data || null;

      if (!imageUrl) {
        console.error('Invalid API response:', data);
        return sendMessage(
          senderId,
          { text: '❌ The API did not return a valid image URL.' },
          pageAccessToken
        );
      }

      // Envoi direct de l’image
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

      await sendMessage(
        senderId,
        { text: `🖼️ Prompt: ${decodeURIComponent(prompt)}` },
        pageAccessToken
      );
    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Failed to create image. Please try again later.' },
        pageAccessToken
      );
    }
  },
};
