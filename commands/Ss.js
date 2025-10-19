const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'screenshot',
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
          // Directly send the image
          await sendMessage(senderId, {
            attachment: { type: 'image', payload: { url } }
          }, pageAccessToken);
          continue;
        }

        // Otherwise, take a screenshot via API
        const apiUrl = `https://haji-mix-api.gleeze.com/api/screenshot?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        const screenshotUrl = data?.screenshot || data?.url || data?.result;

        if (!screenshotUrl) {
          await sendMessage(senderId, { text: `❌ Failed to take screenshot of: ${url}` }, pageAccessToken);
          continue;
        }

        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: screenshotUrl } }
        }, pageAccessToken);

      } catch (error) {
        console.error(`Screenshot Error for ${url}:`, error.message || error);
        await sendMessage(senderId, { text: `❌ An error occurred with: ${url}` }, pageAccessToken);
      }
    }
  }
};
