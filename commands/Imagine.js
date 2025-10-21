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

      const imageUrl = data?.image || data?.image_url || data?.url || data?.result || data?.output || null;

      if (!imageUrl) {
        // debug pour voir ce que l'API renvoie
        await sendMessage(
          senderId,
          { text: `❌ No valid image found.\n\n🧩 API response:\n${JSON.stringify(data, null, 2).slice(0, 1800)}` },
          pageAccessToken
        );
        return;
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

      // Message d’info
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
