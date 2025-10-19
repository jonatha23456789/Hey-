const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const chunkMessage = (text, max = 1900) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += max) {
    chunks.push(text.slice(i, i + max));
  }
  return chunks;
};

module.exports = {
  name: 'lyrics',
  description: 'Send lyrics of a song (auto split for long lyrics)',
  usage: '-lyrics <song name>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a song name.\nUsage: -lyrics <song name>' },
        pageAccessToken
      );
    }

    const query = encodeURIComponent(args.join(' '));
    const apiUrl = `https://archive.lick.eu.org/api/search/lyrics?query=${query}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.result || data.result.length === 0) {
        return sendMessage(
          senderId,
          { text: `❌ Could not find lyrics for "${args.join(' ')}".` },
          pageAccessToken
        );
      }

      const song = data.result[0]; // Premier résultat
      const header = `🎵 *${song.title}* - ${song.artist}\n\n`;

      // Envoi de l'image de l'album si disponible
      if (song.image) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: song.image }
          }
        }, pageAccessToken);
      }

      // Découpage des paroles si trop longues
      const lyricsChunks = chunkMessage(song.lyrics);
      for (const chunk of lyricsChunks) {
        await sendMessage(senderId, { text: header + chunk }, pageAccessToken);
      }

    } catch (error) {
      console.error('Lyrics Command Error:', error.message || error);
      sendMessage(
        senderId,
        { text: '❌ An error occurred while fetching lyrics.' },
        pageAccessToken
      );
    }
  }
};
