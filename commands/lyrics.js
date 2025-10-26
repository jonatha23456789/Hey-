const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'lyrics',
  description: 'Send music lyrics with artist, title, artwork and link',
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

      const { title, artist, image, lyrics, url } = data.data.response;

      // 🖼️ Envoi de l'image d'abord
      if (image) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: { url: image, is_reusable: true }
            }
          },
          pageAccessToken
        );
      }

      // 🎶 Format du texte
      const formatted = `🎵 *Lyrics Found!*\n\n👤 *Artist:* ${artist}\n🎶 *Song:* ${title}\n🌐 *Source:* [View on Genius](${url})\n\n${lyrics}`;

      // Découper en plusieurs messages si trop long
      const maxLength = 1900;
      for (let i = 0; i < formatted.length; i += maxLength) {
        await sendMessage(
          senderId,
          { text: formatted.slice(i, i + maxLength) },
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
  }
};
