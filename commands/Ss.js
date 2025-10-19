const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'screenshot',
  description: 'Take screenshots of one or multiple website links',
  usage: '-screenshot <url1> <url2> ...',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide at least one URL.\nUsage: -screenshot <url1> <url2> ...' },
        pageAccessToken
      );
    }

    for (const urlToCapture of args) {
      try {
        const apiUrl = `https://haji-mix-api.gleeze.com/api/screenshot?url=${encodeURIComponent(urlToCapture)}`;
        const { data } = await axios.get(apiUrl);

        // Vérifie plusieurs champs possibles
        const screenshotUrl = data?.screenshot || data?.url || data?.result;

        if (!screenshotUrl) {
          await sendMessage(senderId, { text: `❌ Failed to take screenshot of: ${urlToCapture}` }, pageAccessToken);
          continue;
        }

        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: screenshotUrl }
          }
        }, pageAccessToken);

      } catch (error) {
        console.error(`Screenshot Error for ${urlToCapture}:`, error.message || error);
        await sendMessage(senderId, {
          text: `❌ An error occurred while taking screenshot of: ${urlToCapture}`
        }, pageAccessToken);
      }
    }
  }
};
