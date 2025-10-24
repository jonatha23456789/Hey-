const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'lyrics',
  description: 'Send music lyrics with artist, song and artwork',
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

    const apiUrl = `https://miko-utilis.vercel.app/api/lyrics?song=${encodeURIComponent(songTitle)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data?.status || !data?.data?.response) {
        return sendMessage(
          senderId,
          { text: '❌ Could not find lyrics for this song.' },
          pageAccessToken
        );
      }

      const song = data.data.response;
      const artist = song.artist || 'Unknown Artist';
      const title = song.title || songTitle;
      const artwork = song.image || null;
      const lyrics = song.lyrics || 'No lyrics found.';

      // 🖼️ Envoie d’abord le visuel de l’album
      if (artwork) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: { url: artwork, is_reusable: true }
            }
          },
          pageAccessToken
        );
      }

      // 🎵 Message stylisé
      const formattedLyrics = `🎶 *${title}* by *${artist}*\n\n${lyrics}\n\n🔗 [View on Genius](${song.url})`;

      // ✂️ Coupe le texte s’il est trop long
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
