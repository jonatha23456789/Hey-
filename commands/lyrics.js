const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'lyrics',
  description: 'Search for song lyrics with image and audio',
  author: 'Hk',
  usage: 'lyrics [song name]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const query = args.join(' ').trim();

    if (!query) {
      return sendMessage(senderId, { text: '⚠️ Please provide a song name.\nExample: lyricspro Shape of You' }, pageAccessToken);
    }

    try {
      await sendMessage(senderId, { text: '🎧 Searching for song lyrics...' }, pageAccessToken);

      // API call
      const apiUrl = `https://api-library-kohi.onrender.com/api/lyrics?query=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data) {
        return sendMessage(senderId, { text: '❌ No lyrics found for this song.' }, pageAccessToken);
      }

      const song = data.data;

      // Image (cover art) — step 1
      if (song.image) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: song.image }
          }
        }, pageAccessToken);
      }

      // Lyrics text — step 2
      const formattedLyrics =
        `🎵 *${song.title}* - ${song.artist}\n\n` +
        `${song.lyrics}\n\n` +
        `🌐 Source: ${song.url || 'Unknown'}`;

      await sendMessage(senderId, { text: formattedLyrics }, pageAccessToken);

      // Audio file — step 3
      if (song.audio) {
        await sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: { url: song.audio }
          }
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('LyricsPro Command Error:', error.message);
      await sendMessage(senderId, { text: '🚨 An error occurred while fetching the lyrics. Please try again later.' }, token);
    }
  }
};
