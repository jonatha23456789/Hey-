const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create AI-generated images using Haji-Mix API.',
  usage: '-imagine <prompt> [count]',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\n\nExample: -imagine anime girl 2' },
        pageAccessToken
      );
    }

    // Récupération du prompt et du nombre d’images
    const match = args.join(' ').match(/^(.+?)\s*(\d+)?$/);
    const prompt = match[1].trim();
    let count = parseInt(match[2]) || 1;
    count = Math.min(Math.max(count, 1), 5); // Limite : entre 1 et 5 images

    try {
      for (let i = 0; i < count; i++) {
        const apiUrl = `https://haji-mix-api.gleeze.com/api/gen?prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        // Vérifie si l’image existe dans la réponse
        if (!data || !data.result || !data.result.image_url) {
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
              payload: { url: data.result.image_url, is_reusable: true }
            }
          },
          pageAccessToken
        );

        // Affiche le prompt utilisé
        await sendMessage(
          senderId,
          { text: `✨ Prompt used: ${prompt}` },
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
