const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'waifu',
  description: 'Random waifu GIF with anime name',
  usage: '-waifu [neko|hug|kiss|smile]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {

      const type = args[0]?.toLowerCase() || 'waifu';
      const valid = ['waifu', 'neko', 'hug', 'kiss', 'smile'];
      const finalType = valid.includes(type) ? type : 'waifu';

      // 🔥 API
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
          { text: '❌ No waifu found.' },
          pageAccessToken
        );
      }

      // 💬 1️⃣ TEXT FIRST
      await sendMessage(
        senderId,
        {
          text:
`💖 WAIFU GENERATED

🎭 Type: ${finalType}
🎬 Anime: ${animeName}
🎨 Artist: ${artist}
✨ Sending image...`
        },
        pageAccessToken
      );

      // 📥 DOWNLOAD MEDIA
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
            type: 'image',
            payload: {}
          }
        })
      );

      form.append(
        'filedata',
        Buffer.from(media.data),
        isGif ? `waifu_${Date.now()}.gif` : `waifu_${Date.now()}.jpg`
      );

      // 📤 2️⃣ IMAGE SECOND
      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

    } catch (error) {
      console.error('Waifu CMD Error:', error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: '❌ Waifu error, try again later.' },
        pageAccessToken
      );
    }
  }
};
