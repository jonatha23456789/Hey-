const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Send random waifu images',
  usage: '-waifu [count]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    let count = parseInt(args[0]) || 1;

    if (count < 1) count = 1;
    if (count > 5) count = 5;

    for (let i = 0; i < count; i++) {

      try {

        let imageUrl = null;

        // 🔥 API 1
        try {

          const { data } = await axios.get(
            'https://api.waifu.im/search?included_tags=waifu',
            { timeout: 20000 }
          );

          imageUrl = data?.images?.[0]?.url;

        } catch (e) {
          console.log('API 1 failed');
        }

        // 🔥 API 2 fallback
        if (!imageUrl) {

          try {

            const { data } = await axios.get(
              'https://nekos.best/api/v2/waifu',
              { timeout: 20000 }
            );

            imageUrl = data?.results?.[0]?.url;

          } catch (e) {
            console.log('API 2 failed');
          }
        }

        // ❌ no image
        if (!imageUrl) {
          continue;
        }

        // =========================
        // 🔥 DOWNLOAD IMAGE
        // =========================

        const img = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        // =========================
        // 🔥 SEND WITH FORMDATA
        // =========================

        const form = new FormData();

        form.append(
          'recipient',
          JSON.stringify({
            id: senderId
          })
        );

        form.append(
          'message',
          JSON.stringify({
            attachment: {
              type: 'image',
              payload: {}
            }
          })
        );

        form.append(
          'filedata',
          Buffer.from(img.data),
          `waifu_${Date.now()}.jpg`
        );

        await axios.post(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          form,
          {
            headers: form.getHeaders()
          }
        );

      } catch (error) {

        console.error(
          'Waifu Command Error:',
          error.response?.data || error.message
        );
      }
    }
  }
};
