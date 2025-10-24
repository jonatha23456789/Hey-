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

      if (!data || !data.status || !data.result) {
        return sendMessage(
          senderId,
          { text: '❌ Could not find lyrics for this song.' },
          pageAccessToken
        );
      }

      const { title, artist, lyrics, thumbnail } = data.result;

      // Envoi de l’image de la musique (thumbnail)
      if (thumbnail) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: { url: thumbnail, is_reusable: true },
            },
          },
          pageAccessToken
        );
      }

      // Texte bien formaté
      const formattedLyrics = `🎵 *Lyrics Info*\n\n👤 *Artist:* ${artist || 'Unknown'}\n🎶 *Song:* ${title || songTitle}\n\n${lyrics || 'No lyrics found.'}`;

      // Découper si texte trop long
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
        { text: '🚨 An error occurred while fetching lyrics.' },
        pageAccessToken
      );
    }
  },
};
