const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ss',
  description: 'See through link (take screenshot)',
  usage: '-screenshot <url>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const urlToCapture = args.join(' ').trim();
    if (!urlToCapture) {
      return sendMessage(senderId, { text: '⚠️ Please provide a URL to capture.\nUsage: -screenshot <url>' }, pageAccessToken);
    }

    // Encode the URL for API call
    const apiUrl = `https://haji-mix-api.gleeze.com/api/screenshot?url=${encodeURIComponent(urlToCapture)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.screenshot) {
        return sendMessage(senderId, { text: '❌ Failed to take screenshot of the URL.' }, pageAccessToken);
      }

      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: { url: data.screenshot }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Screenshot Command Error:', error.message || error);
      await sendMessage(senderId, { text: '❌ An error occurred while taking screenshot.' }, pageAccessToken);
    }
  }
};
