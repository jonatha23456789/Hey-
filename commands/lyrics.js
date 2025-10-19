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

    const apiUrl = `https://lyricstx.vercel.app/musixmatch/lyrics?title=${encodeURIComponent(songTitle)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.lyrics) {
        return sendMessage(
          senderId,
          { text: '❌ Could not find lyrics for this song.' },
          pageAccessToken
        );
      }

      const artist = data.artist_name || 'Unknown';
      const title = data.track_name || songTitle;
      const artwork = data.artwork_url || null;
      const lyrics = data.lyrics;

      // Envoyer l'image de l'album si disponible
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

      // Texte formaté stylé
      const formattedLyrics = `🎵 *Lyrics*\n\n👤 *Artist:* ${artist}\n🎶 *Song:* ${title}\n\n${lyrics}`;

      // Découper en plusieurs messages si trop long
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
