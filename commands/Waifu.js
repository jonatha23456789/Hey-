const axios = require('axios');

module.exports = {
  name: 'waifu',
  description: 'Random anime waifu images (multi styles)',
  usage: '-waifu [neko|hug|kiss|smile]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {

      // 🎯 TYPE (default = waifu)
      const type = args[0]?.toLowerCase() || 'waifu';

      // 🎭 MAP STYLE → nekos.best endpoints
      const validTypes = ['waifu', 'neko', 'hug', 'kiss', 'smile'];

      const finalType = validTypes.includes(type) ? type : 'waifu';

      const { data } = await axios.get(
        `https://nekos.best/api/v2/${finalType}`,
        { timeout: 30000 }
      );

      const imageUrl = data?.results?.[0]?.url;
      const animeName = data?.results?.[0]?.anime_name || 'Unknown';

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ No image found, try again.' },
          pageAccessToken
        );
      }

      // 📤 SEND IMAGE
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

      // 💬 INFO MESSAGE
      await sendMessage(
        senderId,
        {
          text:
`💖 Waifu Generated!

🎭 Type: ${finalType}
🎬 Anime: ${animeName}
✨ Enjoy your waifu 💕`
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
