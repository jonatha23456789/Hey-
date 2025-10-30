const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an AI image using Nekolabs API (custom ratio supported).',
  usage: '-imagine <prompt> [ratio]',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (args.length === 0) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nExample: -imagine anime girl 16:9' },
        pageAccessToken
      );
    }

    // Extraction du ratio à la fin du message
    let ratio = '1:1';
    const lastArg = args[args.length - 1];
    if (/^\d+:\d+$/.test(lastArg)) {
      ratio = lastArg;
      args.pop(); // Retire le ratio du prompt
    }

    const prompt = args.join(' ').trim();
    const apiUrl = `https://api.nekolabs.web.id/ai/imagen/4?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.success || !data.result) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image. Please try again later.' },
          pageAccessToken
        );
      }

      // Envoi du message texte avant l’image
      await sendMessage(
        senderId,
        {
          text: `✨ *AI Image Created!*\n🎨 Prompt: ${prompt}\n🖼️ Ratio: ${ratio}\n🕒 Response Time: ${data.responseTime || 'N/A'}`,
        },
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
