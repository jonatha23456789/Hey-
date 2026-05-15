const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'waifu',
  description: 'Send random waifu images',
  usage: '-waifu [count 1-5]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    // 🔥 number of images
    let count = parseInt(args[0]) || 1;

    if (count < 1) count = 1;
    if (count > 5) count = 5;

    // 🔥 WORKING APIs
    const apis = [
      'https://api.waifu.im/search?included_tags=waifu',
      'https://nekos.best/api/v2/waifu'
    ];

    for (let i = 0; i < count; i++) {

      try {

        let imageUrl = null;

        // =========================
        // 🔥 API 1 (waifu.im)
        // =========================
        try {

          const { data } = await axios.get(apis[0], {
            timeout: 20000
          });

          imageUrl = data?.images?.[0]?.url;

        } catch (e) {
          console.log('API 1 failed');
        }

        // =========================
        // 🔥 API 2 (nekos.best)
        // =========================
        if (!imageUrl) {

          try {

            const { data } = await axios.get(apis[1], {
              timeout: 20000
            });

            imageUrl = data?.results?.[0]?.url;

          } catch (e) {
            console.log('API 2 failed');
          }
        }

        // ❌ no image
        if (!imageUrl) {

          await sendMessage(
            senderId,
            {
              text: '❌ Failed to fetch waifu image.'
            },
            pageAccessToken
          );

          continue;
        }

        // ✅ send image
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

        console.error(
          'Waifu Command Error:',
          error.response?.data || error.message
        );

        await sendMessage(
          senderId,
          {
            text:
              '❌ Error while fetching waifu image.'
          },
          pageAccessToken
        );
      }
    }
  }
};
