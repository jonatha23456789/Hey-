const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Fonction pour nettoyer et styliser les lyrics
function cleanLyrics(text) {
  if (!text) return '❌ No lyrics available.';

  let cleaned = text
    // Supprime les parties inutiles (contributors, traductions, etc.)
    .replace(/^\d+\s*Contributors?.*/gim, '')
    .replace(/Translations.*?(?=\[|$)/gims, '')
    .replace(/(Lyrics\s*)+/gi, '')
    .replace(/Deutsch|Français|Українська|हिन्दी|Português|English/gi, '')
    .replace(/\b[A-Z ]{3,} Lyrics\b/g, '') // Supprime "MISTAKE Lyrics" ou équivalents
    .replace(/\s{2,}/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Ajoute de la couleur avec emoji selon les sections
  cleaned = cleaned
    .replace(/\[Chorus\]/gi, '🟦 [Chorus]')
    .replace(/\[Verse\s*\d*\]/gi, '🟩 $&')
    .replace(/\[Bridge\]/gi, '🟧 [Bridge]')
    .replace(/\[Outro\]/gi, '🟥 [Outro]')
    .replace(/\[Intro\]/gi, '🟨 [Intro]')
    .replace(/\[Pre-Chorus\]/gi, '🟪 [Pre-Chorus]');

  return cleaned;
}

module.exports = {
  name: 'lyrics',
  description: 'Send clean music lyrics with artist, song and artwork',
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

      const cleanText = cleanLyrics(lyrics);

      // Envoi de l’image de la chanson si disponible
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

      // Envoi du texte bien formaté
      const formatted = `🎵 *Lyrics Found!*\n\n👤 *Artist:* ${artist}\n🎶 *Song:* ${title}\n🌐 *Source:* [View on Genius](${url})\n\n${cleanText}`;

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
