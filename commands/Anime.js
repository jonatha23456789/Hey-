const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'anime',
  description: 'Search for anime details',
  author: 'Hk',
  usage: 'anime [anime title]',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();
    if (!query) {
      return sendMessage(senderId, { text: '⚠️ Please provide an anime title.\nExample: anime Bleach' }, pageAccessToken);
    }

    try {
      await sendMessage(senderId, { text: '🔎 Searching anime details...' }, pageAccessToken);

      // Fetch data from API
      const url = `https://arychauhann.onrender.com/api/animeinfo?url=https%3A%2F%2Fmyanimelist.net%2Fanime%2F${encodeURIComponent(query)}`;
      const response = await axios.get(url);
      const data = response.data;

      // Debug: check the structure
      console.log('API response structure:', Object.keys(data));

      // Sometimes info is nested under "data"
      const anime = data.data || data;

      if (!anime || !anime.title) {
        return sendMessage(senderId, { text: '❌ No details found for this anime.' }, pageAccessToken);
      }

      // Format the message
      const message = `🎬 *${anime.title}*\n` +
        `🎌 Japanese: ${anime.alternativeTitles?.japanese || 'Unknown'}\n` +
        `📺 Type: ${anime.information?.type || 'Unknown'}\n` +
        `📅 Aired: ${anime.information?.aired || 'Unknown'}\n` +
        `🏆 Score: ${anime.statistics?.score || 'N/A'} (${anime.statistics?.ranked || 'N/A'})\n` +
        `👥 Popularity: ${anime.statistics?.popularity || 'N/A'}\n` +
        `🎙️ Studio: ${anime.information?.studios || 'Unknown'}\n` +
        `🎭 Genre: ${anime.information?.genres || 'Unknown'}\n\n` +
        `🧾 Synopsis:\n${anime.synopsis || 'No synopsis available.'}\n\n` +
        `🔗 [View on MAL](${anime.link || 'https://myanimelist.net'})`;

      // Send the anime image first (if available)
      if (anime.imageUrl) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: anime.imageUrl }
          }
        }, pageAccessToken);
      }

      // Then send details text
      await sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error('Anime Command Error:', error.message);
      sendMessage(senderId, { text: '🚨 An error occurred while fetching anime details. Try again later.' }, pageAccessToken);
    }
  }
};
