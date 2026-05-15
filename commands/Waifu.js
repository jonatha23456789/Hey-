const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Random waifu GIF with anime name',
  usage: '-waifu [neko|hug|kiss|smile]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {

      // 🎭 TYPE
      const type = args[0]?.toLowerCase() || 'waifu';
      const valid = ['waifu', 'neko', 'hug', 'kiss', 'smile'];
      const finalType = valid.includes(type) ? type : 'waifu';

      // 🔥 API (GIF support)
      const { data } = await axios.get(
        `https://nekos.best/api/v2/${finalType}`,
        { timeout: 30000 }
      );

      const mediaUrl = data?.results?.[0]?.url;
      const animeName = data?.results?.[0]?.anime_name || 'Unknown';
      const artist = data?.results?.[0]?.artist_name || 'Unknown';

      if (!mediaUrl) {
        return sendMessage(
          senderId,
          { text: '❌ No waifu GIF found.' },
          pageAccessToken
        );
      }

      // 📥 DOWNLOAD GIF/IMAGE
      const media = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const isGif = mediaUrl.endsWith('.gif');

      const form = new FormData();

      form.append(
        'recipient',
        JSON.stringify({ id: senderId })
      );

      form.append(
        'message',
        JSON.stringify({
          attachment: {
            type: isGif ? 'image' : 'image',
            payload: {}
          }
        })
      );

      form.append(
        'filedata',
        Buffer.from(media.data),
        isGif ? `waifu_${Date.now()}.gif` : `waifu_${Date.now()}.jpg`
      );

      // 📤 SEND TO FACEBOOK
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
`💖 WAIFU ANIME GENERATED

🎭 Type: ${finalType}
🎬 Anime: ${animeName}
🎨 Artist: ${artist}
✨ Enjoy 💕`
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Waifu GIF CMD Error:', error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: '❌ Waifu GIF error, try again later.' },
        pageAccessToken
      );
    }
  }
};
