const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'lyrics',
  description: 'Send only the music cover image',
  usage: '-lyrics <song title>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const songTitle = args.join(' ').trim();
    if (!songTitle) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a song title.\nUsage: -lyrics <song title>' },
        pageAccessToken
      );
    }

    const apiUrl = `https://lyricstx.vercel.app/musixmatch/lyrics?title=${encodeURIComponent(songTitle)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.image) {
        return sendMessage(
          senderId,
          { text: '❌ Could not find an image for this song.' },
          pageAccessToken
        );
      }

      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: { url: data.image, is_reusable: true }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Lyrics Image Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while fetching the music image.' },
        pageAccessToken
      );
    }
  }
};
