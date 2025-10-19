const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'lyrics',
  description: 'Send music lyrics',
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

      if (!data || !data.lyrics || !data.artist) {
        return sendMessage(
          senderId,
          { text: '❌ Could not find lyrics for this song.' },
          pageAccessToken
        );
      }

      const formattedLyrics = `🎵 *Lyrics*\n\n👤 *Artist:* ${data.artist}\n🎶 *Song:* ${data.title || songTitle}\n\n${data.lyrics}`;

      // Diviser le texte en plusieurs messages si trop long
      const maxLength = 1900;
      for (let i = 0; i < formattedLyrics.length; i += maxLength) {
        await sendMessage(
          senderId,
          { text: formattedLyrics.slice(i, i + maxLength) },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error('Lyrics Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while fetching lyrics.' },
        pageAccessToken
      );
    }
  }
};
