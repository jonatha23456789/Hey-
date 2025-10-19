const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'waifu',
  description: 'Send waifu images (SFW or NSFW if allowed)',
  usage: '-waifu [count 1-5]',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    // Nombre d'images à envoyer, par défaut 1
    let count = parseInt(args[0], 10) || 1;
    if (count < 1) count = 1;
    if (count > 5) count = 5;

    const apiUrlSFW = 'https://api.waifu.pics/sfw/waifu';

    for (let i = 0; i < count; i++) {
      try {
        const { data } = await axios.get(apiUrlSFW);

        if (!data || !data.url) {
          await sendMessage(senderId, { text: '❌ Failed to fetch waifu image.' }, pageAccessToken);
          continue;
        }

        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: data.url } }
        }, pageAccessToken);

      } catch (error) {
        console.error('Waifu Command Error:', error.message || error);
        await sendMessage(senderId, { text: '❌ An error occurred while fetching waifu image.' }, pageAccessToken);
      }
    }
  }
};
