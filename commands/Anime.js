const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'anime',
  description: 'Search for anime details',
  author: 'Hk',
  usage: '-animesearch <MyAnimeList URL>',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a MyAnimeList anime URL.\n\nExample: -animesearch https://myanimelist.net/anime/4835/Bleach_Movie_3__Fade_to_Black' },
        pageAccessToken
      );
    }

    const animeUrl = args[0];
    const apiUrl = `https://arychauhann.onrender.com/api/animeinfo?url=${encodeURIComponent(animeUrl)}`;

    try {
      await sendMessage(senderId, { text: '🔍 Searching anime details...' }, pageAccessToken);
      const { data } = await axios.get(apiUrl);

      if (!data.title) {
        return sendMessage(senderId, { text: '❌ No details found for this anime.' }, pageAccessToken);
      }

      const info = data.information || {};
      const stats = data.statistics || {};
      const alt = data.alternativeTitles || {};

      const details = `🎥 **${data.title}**\n\n` +
        `📺 **Type:** ${info.type || 'Unknown'}\n` +
        `📅 **Aired:** ${info.aired || 'N/A'}\n` +
        `🏷️ **Genres:** ${info.genres || 'N/A'}\n` +
        `🎙️ **Studio:** ${info.studios || 'Unknown'}\n` +
        `⭐ **Score:** ${stats.score || 'N/A'} (${stats.popularity || 'N/A'})\n\n` +
        `🈶 **Japanese:** ${alt.japanese || 'N/A'}\n` +
        `🇬🇧 **English:** ${alt.english || 'N/A'}\n\n` +
        `📖 **Synopsis:**\n${data.synopsis?.slice(0, 1000) || 'No synopsis available.'}\n\n` +
        `🔗 [View on MyAnimeList](${data.link})`;

      // Envoi de l'image + détails
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: data.imageUrl,
            is_reusable: true
          }
        }
      }, pageAccessToken);

      await sendMessage(senderId, { text: details }, pageAccessToken);

      // Liens externes (si dispo)
      if (data.externalLinks && data.externalLinks.length > 0) {
        const linksText = data.externalLinks.map(l => `🌐 [${l.name}](${l.url})`).join('\n');
        await sendMessage(senderId, { text: `🔗 **External Links:**\n${linksText}` }, pageAccessToken);
      }

    } catch (error) {
      console.error('Erreur AnimeSearch:', error.message);
      sendMessage(senderId, { text: '🚨 An error occurred while fetching anime details.' }, pageAccessToken);
    }
  }
};
