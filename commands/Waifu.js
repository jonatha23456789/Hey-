const axios = require('axios');

module.exports = {
  name: 'waifu',
  description: 'Random waifu image',
  usage: '-waifu',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {

      const { data } = await axios.get(
        'https://nekos.best/api/v2/waifu',
        { timeout: 30000 }
      );

      const imageUrl = data?.results?.[0]?.url;

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ No waifu found, try again.' },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Waifu CMD Error:', error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: '❌ Waifu API error, try again later.' },
        pageAccessToken
      );
    }
  }
};
