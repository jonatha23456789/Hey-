const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'lyrics',
  description: 'Send lyrics of a song',
  usage: '-lyrics <song name>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '⚠️ Please provide a song name.\nUsage: -lyrics <song name>' }, pageAccessToken);
    }

    const query = encodeURIComponent(args.join(' '));
    const apiUrl = `https://delirius-apiofc.vercel.app/search/musixmatch?query=${query}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data) {
        return sendMessage(senderId, { text: '❌ Could not find lyrics for this song.' }, pageAccessToken);
      }

      const song = data.data;
      const message = `🎵 *${song.title}* - ${song.artist}\n\n` +
                      `Album: ${song.album}\n` +
                      `🔗 [View on Musixmatch](${song.track_share_url})\n\n` +
                      `Lyrics:\n${song.lyrics}`;

      await sendMessage(senderId, { text: message }, pageAccessToken);

      // Optionally send album image
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
