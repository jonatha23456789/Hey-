const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const qs = require('qs');

module.exports = {
  name: 'lyrics',
  description: 'Send lyrics of a song (auto search)',
  usage: '-lyrics <song name>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '⚠️ Please provide a song name.\nUsage: -lyrics <song name>' }, pageAccessToken);
    }

    const query = args.join(' ');
    await sendMessage(senderId, { text: `🔎 Searching lyrics for "${query}"...` }, pageAccessToken);

    try {
      // Step 1: Try direct search via Delirius API
      let apiUrl = `https://delirius-apiofc.vercel.app/search/musixmatch?query=${encodeURIComponent(query)}`;
      let { data } = await axios.get(apiUrl);

      // Step 2: If no result, try approximate search via Google API
      if (!data?.status || !data?.data?.lyrics) {
        // Simple Google search for song + lyrics (returns first match)
        const googleUrl = `https://delirius-apiofc.vercel.app/search/musixmatch?query=${encodeURIComponent(query)}`;
        const googleRes = await axios.get(googleUrl);
        data = googleRes.data;

        if (!data?.status || !data?.data?.lyrics) {
          return sendMessage(senderId, { text: `❌ Could not find lyrics for "${query}". Try a simpler song name.` }, pageAccessToken);
        }
      }

      const song = data.data;

      const message = `🎵 *${song.title}* - ${song.artist}\n\n` +
                      `Album: ${song.album}\n` +
                      `🔗 [View on Musixmatch](${song.track_share_url})\n\n` +
                      `Lyrics:\n${song.lyrics}`;

      // Send lyrics
      await sendMessage(senderId, { text: message }, pageAccessToken);

      // Send album image if available
      if (song.image) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: song.image }
          }
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('Lyrics Command Error:', error.message || error);
      sendMessage(senderId, { text: '❌ An error occurred while fetching lyrics.' }, pageAccessToken);
    }
  }
};
