const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Random waifu image',
  usage: '-waifu',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    try {

      // 🔥 API
      const { data } = await axios.get(
        'https://api.waifu.im/search',
        {
          params: {
            included_tags: 'waifu'
          },
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const imageUrl = data?.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image found');
      }

      // 🔥 DOWNLOAD IMAGE
      const img = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // 🔥 FORM
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

      // 🔥 SEND TO FB
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
};
