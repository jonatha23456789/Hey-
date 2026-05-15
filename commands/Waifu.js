const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Random anime waifu images (fixed)',
  usage: '-waifu [neko|hug|kiss|smile]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {

      const type = args[0]?.toLowerCase() || 'waifu';
      const valid = ['waifu', 'neko', 'hug', 'kiss', 'smile'];
      const finalType = valid.includes(type) ? type : 'waifu';

      const { data } = await axios.get(
        `https://nekos.best/api/v2/${finalType}`,
        { timeout: 30000 }
      );

      const imageUrl = data?.results?.[0]?.url;
      const animeName = data?.results?.[0]?.anime_name || 'Unknown';

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ No image found.' },
          pageAccessToken
        );
      }

      // 🔥 DOWNLOAD IMAGE (IMPORTANT FIX)
      const img = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      const form = new FormData();

      form.append(
        'recipient',
        JSON.stringify({ id: senderId })
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
        { headers: form.getHeaders() }
      );

      // 💬 INFO MESSAGE
      await sendMessage(
        senderId,
        {
          text:
`💖 Waifu Generated!

🎭 Type: ${finalType}
🎬 Anime: ${animeName}`
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Waifu CMD Error:', error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: '❌ Waifu API error, try again later.' },
        pageAccessToken
      );
    }
  }
};
