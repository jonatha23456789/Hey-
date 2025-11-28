const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an AI image using Nekolabs API 4.0-fast (custom ratio supported).',
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

    // Detect ratio at end of prompt
    let ratio = '1:1';
    const lastArg = args[args.length - 1];

    if (/^\d+:\d+$/.test(lastArg)) {
      ratio = lastArg;
      args.pop();
    }

    const prompt = args.join(' ').trim();

    // ✅ NEW API URL
    const apiUrl = `https://api.nekolabs.web.id/image-generation/imagen/4.0-fast?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.success || !data.result) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image. Please try again later.' },
          pageAccessToken
        );
      }

      // Send the text message before the image
      await sendMessage(
        senderId,
        {
          text: `✨ *AI Image Created!*\n🎨 Prompt: ${prompt}\n🖼️ Ratio: ${ratio}\n🕒 Response Time: ${data.responseTime || 'N/A'}`,
        },
        pageAccessToken
      );

      // Send the generated image
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
