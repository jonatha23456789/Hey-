const axios = require('axios');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'GENERATE IMAGE FROM PROMPT',
  usage: 'imagine <prompt>',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    try {

      const prompt = args.join(' ').trim();

      if (!prompt) {
        return sendMessage(
          senderId,
          { text: '⚠️ Usage: imagine <prompt>' },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        { text: '🎨 Generating image...' },
        pageAccessToken
      );

      const api =
        `https://christus-api.vercel.app/image/animagine?prompt=${encodeURIComponent(prompt)}`;

      const { data } = await axios.get(api);

      if (!data?.status || !data?.image_url) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image.' },
          pageAccessToken
        );
      }

      const imageUrl = data.image_url;

      // 🔹 Download image
      const img = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(img.data, 'binary');

      // 🔹 Send image buffer
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {}
          },
          filedata: buffer
        },
        pageAccessToken
      );

    } catch (err) {

      console.error(
        'Imagine CMD Error:',
        err.response?.data || err.message
      );

      sendMessage(
        senderId,
        { text: '❌ Error generating image.' },
        pageAccessToken
      );
    }
  }
};
