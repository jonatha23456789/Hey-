const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Random waifu image',
  usage: '-waifu [1-5]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    let count = parseInt(args[0]) || 1;

    if (count < 1) count = 1;
    if (count > 5) count = 5;

    for (let i = 0; i < count; i++) {

      try {

        // =========================
        // 🔥 GET IMAGE URL
        // =========================

        const { data } = await axios.get(
          'https://nekos.life/api/v2/img/waifu',
          {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        const imageUrl = data?.url;

        if (!imageUrl) {
          console.log('No image URL');
          continue;
        }

        // =========================
        // 🔥 DOWNLOAD IMAGE
        // =========================

        const img = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://nekos.life/'
          }
        });

        const contentType = img.headers['content-type'];

        if (!contentType?.startsWith('image')) {
          console.log('Invalid image type');
          continue;
        }

        // =========================
        // 🔥 SEND TO FACEBOOK
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
            headers: form.getHeaders(),
            maxBodyLength: Infinity
          }
        );

      } catch (error) {

        console.error(
          'Waifu CMD Error:',
          error.response?.data || error.message
        );
      }
    }
  }
};
