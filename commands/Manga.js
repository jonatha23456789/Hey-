const axios = require('axios');

let cachedMangas = [];
let cachedChapters = [];

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',

  async execute(event, bot) {
    const text = (event.message && event.message.text) || event.text || event.body || '';
    if (!text) return;

    const args = text.trim().split(' ').slice(1);
    const senderId = event.sender ? event.sender.id : event.from;

    if (!args.length) {
      return bot.sendMessage(senderId, 'Usage : `!manga <titre>` pour rechercher un manga.');
    }

    const command = args[0].toLowerCase();

    // Lire un chapitre
    if (command === 'lire') {
      const chapterIndex = parseInt(args[1], 10) - 1;
      if (isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= cachedChapters.length) {
        return bot.sendMessage(senderId, 'Numéro de chapitre invalide.');
      }

      const chapter = cachedChapters[chapterIndex];
      if (!chapter.pages || !chapter.pages.length) {
        return bot.sendMessage(senderId, 'Aucune page trouvée pour ce chapitre.');
      }

      for (const pageUrl of chapter.pages) {
        await bot.sendMessage(senderId, { attachment: { type: 'image', payload: { url: pageUrl } } });
      }
      return;
    }

    // Voir les chapitres d’un manga sélectionné
    if (command === 'chap') {
      const mangaIndex = parseInt(args[1], 10) - 1;
      if (isNaN(mangaIndex) || mangaIndex < 0 || mangaIndex >= cachedMangas.length) {
        return bot.sendMessage(senderId, 'Numéro de manga invalide.');
      }

      const manga = cachedMangas[mangaIndex];

      try {
        const res = await axios.get(`https://miko-utilis.vercel.app/api/manga-chapters?mangaId=${manga.id}`);
        const chapters = res.data.data.results || [];

        if (!chapters.length) return bot.sendMessage(senderId, 'Aucun chapitre trouvé.');

        cachedChapters = chapters.map(ch => ({
          title: ch.title,
          pages: ch.pages,
        }));

        const list = chapters.map((ch, i) => `${i + 1}. ${ch.title}`).join('\n');
        return bot.sendMessage(senderId, `Chapitres pour "${manga.title}" :\n\n${list}\n\nEnvoyez \`!manga lire <numéro>\` pour lire.`);
      } catch (err) {
        return bot.sendMessage(senderId, 'Erreur lors de la récupération des chapitres.');
      }
    }

    // Recherche de mangas
    const title = args.join(' ');
    try {
      const res = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(title)}`);
      const mangas = res.data.data.results || [];
      if (!mangas.length) return bot.sendMessage(senderId, `Aucun manga trouvé pour "${title}".`);

      cachedMangas = mangas;

      // Envoyer chaque manga avec sa couverture
      for (let i = 0; i < mangas.length; i++) {
        const m = mangas[i];
        await bot.sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: m.cover },
          },
        });
        await bot.sendMessage(senderId, `${i + 1}. ${m.title}`);
      }

      await bot.sendMessage(senderId, 'Répondez avec `!manga chap <numéro>` pour voir les chapitres du manga choisi.');
    } catch (err) {
      return bot.sendMessage(senderId, 'Erreur lors de la recherche du manga.');
    }
  },
};
