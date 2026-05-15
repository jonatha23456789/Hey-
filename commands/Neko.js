const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'neko',
  description: 'Random neko image',
  usage: '-neko',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    try {

      // =========================
      // 🔥 GET NEKO IMAGE
      // =========================

      const { data } = await axios.get(
        'https://nekos.life/api/v2/img/neko',
        {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const imageUrl = data?.url;

      if (!imageUrl) {
        throw new Error('No image URL');
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

      // 🔥 CHECK IMAGE
      const contentType = img.headers['content-type'];

      if (!contentType?.startsWith('image')) {
        throw new Error('Invalid image type');
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
        `neko_${Date.now()}.jpg`
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
        'Neko CMD Error:',
        error.response?.data || error.message
      );
    }
  }
};
