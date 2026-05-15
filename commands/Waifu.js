const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

module.exports = {
  name: 'waifu',
  description: 'Random waifu image 9:16',
  usage: '-waifu [1-5]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {

    let count = parseInt(args[0]) || 1;

    if (count < 1) count = 1;
    if (count > 5) count = 5;

    for (let i = 0; i < count; i++) {

      try {

        // 🔥 GET IMAGE URL
        const { data } = await axios.get(
          'https://nekos.life/api/v2/img/waifu'
        );

        const imageUrl = data?.url;

        if (!imageUrl) continue;

        // 🔥 DOWNLOAD IMAGE
        const img = await axios.get(imageUrl, {
          responseType: 'arraybuffer'
        });

        // 🔥 CONVERT TO 9:16
        const finalImage = await sharp(img.data)
          .resize(720, 1280, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        // 🔥 SEND TO FB
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
          finalImage,
          'waifu_vertical.jpg'
        );

        await axios.post(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          form,
          {
            headers: form.getHeaders(),
            maxBodyLength: Infinity
          }
        );

      } catch (err) {

        console.error(
          'Waifu CMD Error:',
          err.response?.data || err.message
        );
      }
    }
  }
};
