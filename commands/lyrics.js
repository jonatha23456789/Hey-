const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Fonction pour nettoyer les paroles
function cleanLyrics(text) {
  if (!text) return '❌ No lyrics available.';
  return text
    .replace(/Translations.*/gi, '') // retire les sections "Translations..."
    .replace(/Deutsch|Français|Українська|हिन्दी.*|Português|English/gi, '')
    .replace(/Contributors.*/gi, '')
    .replace(/Lyrics\s*$/gi, '') // retire le mot "Lyrics" à la fin du titre
    .replace(/\n{3,}/g, '\n\n') // supprime les multiples sauts de ligne
    .trim();
}

module.exports = {
  name: 'lyrics',
  description: 'Send clean music lyrics with artist, song and source',
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

      // Nettoyage du texte des paroles
      const cleanText = cleanLyrics(lyrics);

      // Envoi de l’image si disponible
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

      // Format stylé
      const header = `👤 *Artist:* ${artist}\n🎶 *Song:* ${title}\n🌐 *Source:* [View on Genius](${url})\n\n${cleanText}`;

      // Découper en plusieurs messages si trop long
      const maxLength = 1900;
      for (let i = 0; i < header.length; i += maxLength) {
        await sendMessage(
          senderId,
          { text: header.slice(i, i + maxLength) },
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
