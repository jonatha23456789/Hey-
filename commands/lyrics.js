const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Fonction pour nettoyer et formater joliment les paroles
function cleanLyrics(text) {
  if (!text) return '❌ No lyrics available.';

  let cleaned = text
    .replace(/^\d+\s*Contributors?.*/gim, '')
    .replace(/Translations.*?(?=\[|$)/gims, '')
    .replace(/(Lyrics\s*)+/gi, '')
    .replace(/Deutsch|Français|Українська|हिन्दी|Português|English/gi, '')
    .replace(/\b[A-Z ]{3,} Lyrics\b/g, '')
    .replace(/\s{2,}/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Ajoute les emojis + saut de ligne avant chaque section
  cleaned = cleaned
    .replace(/\[Intro\]/gi, '\n\n🟨 [Intro]\n')
    .replace(/\[Chorus\]/gi, '\n\n🟦 [Chorus]\n')
    .replace(/\[Verse\s*\d*\]/gi, '\n\n🟩 $&\n')
    .replace(/\[Bridge\]/gi, '\n\n🟧 [Bridge]\n')
    .replace(/\[Pre-Chorus\]/gi, '\n\n🟪 [Pre-Chorus]\n')
    .replace(/\[Outro\]/gi, '\n\n🟥 [Outro]\n');

  // Ajoute un espace entre les lignes pour plus de lisibilité
  cleaned = cleaned.replace(/\n/g, '\n\n');

  return cleaned.trim();
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

      // Envoi de l’image d’abord
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

      // Envoi du texte formaté
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
