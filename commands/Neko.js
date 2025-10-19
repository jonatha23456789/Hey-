const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'neko',
  description: 'Send neko image',
  usage: '-neko',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const apiUrl = 'https://koja-api.web-server.xyz/anime?type=sfw&category=neko';

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.url) {
        return sendMessage(senderId, { text: '❌ Failed to fetch neko image.' }, pageAccessToken);
      }

      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: { url: data.url }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Neko Command Error:', error.message || error);
      sendMessage(senderId, { text: '❌ An error occurred while fetching neko image.' }, pageAccessToken);
    }
  }
};
