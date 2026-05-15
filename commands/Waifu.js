const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'waifu',
  description: 'Vertical waifu images',
  usage: '-waifu [1-5]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    let count = parseInt(args[0]) || 1;

    if (count < 1) count = 1;
    if (count > 5) count = 5;

    for (let i = 0; i < count; i++) {

      try {

        // 🔥 API
        const { data } = await axios.get(
          'https://api.waifu.im/search?included_tags=waifu',
          {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        const imageUrl = data?.images?.[0]?.url;

        if (!imageUrl) {
          await sendMessage(
            senderId,
            { text: '❌ Failed to fetch waifu image.' },
            pageAccessToken
          );
          continue;
        }

        // 🔥 SEND VERTICAL TEMPLATE
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'media',
                elements: [
                  {
                    media_type: 'image',
                    url: imageUrl
                  }
                ]
              }
            }
          },
          pageAccessToken
        );

      } catch (error) {

        console.error(
          'Waifu CMD Error:',
          error.response?.data || error.message
        );

        await sendMessage(
          senderId,
          {
            text: '❌ Error while fetching waifu image.'
          },
          pageAccessToken
        );
      }
    }
  }
};
