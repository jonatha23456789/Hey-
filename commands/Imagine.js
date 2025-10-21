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

    const match = args.join(' ').match(/^(.+?)\s*(\d+)?$/);
    const prompt = match[1].trim();
    let count = parseInt(match[2]) || 1;
    count = Math.min(Math.max(count, 1), 5); // max 5 images

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

        // 🔹 Envoi d’abord le message d’information
        await sendMessage(
          senderId,
          { text: `✨ Image created successfully \n🖼️ Prompt: ${prompt}` },
          pageAccessToken
        );

        // 🔹 Puis l’image après le texte
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
      }
    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
