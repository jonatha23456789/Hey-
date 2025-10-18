const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'anime',
  description: 'Search for anime details by name',
  author: 'Hk',
  usage: '-animesearch <anime name>',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();
    if (!query) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide an anime name.\nExample: -animesearch Bleach' },
        pageAccessToken
      );
    }

    try {
      await sendMessage(senderId, { text: '🔎 Searching for anime...' }, pageAccessToken);

      // 🔹 Recherche principale avec Jikan API
      const jikanUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;
      const jikanRes = await axios.get(jikanUrl);
      const animeData = jikanRes.data.data?.[0];

      // 🔸 Si rien trouvé, fallback vers AryChauhan API
      if (!animeData) {
        const fallbackUrl = `https://arychauhann.onrender.com/api/animeinfo?url=https://myanimelist.net/anime?q=${encodeURIComponent(query)}`;
        const fallbackRes = await axios.get(fallbackUrl);
        if (!fallbackRes.data || !fallbackRes.data.title) {
          throw new Error('No anime data found in both APIs.');
        }
        const data = fallbackRes.data;

        const message = `🎬 *${data.title}*\n\n📝 ${data.synopsis}\n\n📺 Type: ${data.information?.type}\n🌟 Score: ${data.statistics?.score}\n🎙️ Studio: ${data.information?.studios}\n🔗 [MyAnimeList Link](${data.link})`;

        await sendMessage(senderId, { text: message }, pageAccessToken);

        if (data.image) {
          await sendMessage(senderId, {
            attachment: { type: 'image', payload: { url: data.image } },
          }, pageAccessToken);
        }

        return;
      }

      // 🔹 Formatage des données Jikan
      const anime = animeData;
      const title = anime.title || 'Unknown';
      const imageUrl = anime.images?.jpg?.image_url;
      const synopsis = anime.synopsis || 'No synopsis available.';
      const type = anime.type || 'N/A';
      const episodes = anime.episodes || 'N/A';
      const score = anime.score || 'N/A';
      const status = anime.status || 'N/A';
      const genres = anime.genres?.map(g => g.name).join(', ') || 'N/A';
      const link = anime.url;

      // 📝 Envoi du texte d'abord
      const message = `🎬 *${title}*\n\n📺 Type: ${type}\n🎞️ Episodes: ${episodes}\n📊 Score: ${score}\n📅 Status: ${status}\n📚 Genres: ${genres}\n\n📝 Synopsis:\n${synopsis}\n\n🔗 [More Info](${link})`;

      await sendMessage(senderId, { text: message }, pageAccessToken);

      // 🖼️ Ensuite l'image
      if (imageUrl) {
        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: imageUrl } },
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('❌ AnimeSearch Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: `⚠️ An error occurred while fetching anime details.\n\n🧠 Error: ${error.message}` },
        pageAccessToken
      );
    }
  },
};
