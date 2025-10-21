const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create image using Aryan Chauhan AI API.',
  usage: '-imagine <prompt> [count]',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nExample: -imagine anime girl 2' },
        pageAccessToken
      );
    }

    // Analyse du prompt et du nombre d’images
    const match = args.join(' ').match(/^(.+?)\s*(\d+)?$/);
    const prompt = match[1].trim();
    let count = parseInt(match[2]) || 1;
    count = Math.min(Math.max(count, 1), 5); // Limite : 1 à 5 images max

    try {
      for (let i = 0; i < count; i++) {
        const apiUrl = `https://arychauhann.onrender.com/api/xl?prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || data.status !== 'success' || !data.url) {
          await sendMessage(
            senderId,
            { text: `❌ Failed to generate image for: ${prompt}` },
            pageAccessToken
          );
          continue;
        }

        // Envoi de l’image
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: { url: data.url, is_reusable: true }
            }
          },
          pageAccessToken
        );

        // Message d’information
        await sendMessage(
          senderId,
          { text: `✨ Image created successfully by anime focus AI\n🖼️ Prompt: ${prompt}` },
          pageAccessToken
        );
      }
    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      sendMessage(
        senderId,
        { text: '🚨 An error occurred while generating the image.' },
        pageAccessToken
      );
    }
  }
};
