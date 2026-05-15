const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Random waifu images',
  usage: '-waifu [name]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    try {

      // 🔥 query
      const query = args.join(' ').trim() || 'waifu';

      // 🔥 API
      const api =
        `https://nekos.best/api/v2/search?query=${encodeURIComponent(query)}&type=1`;

      const { data } = await axios.get(api, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // 🔥 get image
      const result = data?.results?.[0];

      if (!result?.url) {

        return axios.post(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          {
            recipient: {
              id: senderId
            },
            message: {
              text: '❌ No waifu found.'
            }
          }
        );
      }

      // 🔥 download image
      const img = await axios.get(result.url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // 🔥 create form
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

      // 🔥 send image
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
