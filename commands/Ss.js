const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ss',
  description: 'Take screenshots of webpages or send images directly',
  usage: '-screenshot <url1> <url2> ...',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '⚠️ Please provide at least one URL.\nUsage: -screenshot <url1> <url2> ...' }, pageAccessToken);
    }

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

    for (const url of args) {
      try {
        const isImage = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));

        if (isImage) {
          await sendMessage(senderId, {
            attachment: { type: 'image', payload: { url } }
          }, pageAccessToken);
          continue;
        }

        // Nouvelle API — fonctionne sur YouTube
        const screenshotUrl = `https://image.thum.io/get/full/${encodeURIComponent(url)}`;

        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: screenshotUrl }
          }
        }, pageAccessToken);

      } catch (error) {
        console.error(`Screenshot Error for ${url}:`, error.message || error);
        await sendMessage(senderId, { text: `❌ An error occurred with: ${url}` }, pageAccessToken);
      }
    }
  }
};
