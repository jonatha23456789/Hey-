const axios = require('axios');

let cachedMangas = [];
let cachedChapters = [];

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',

  async execute(event, bot) {
    const userId = event.sender.id;
    const text = (event.message && event.message.text) || '';
    const args = text.trim().split(' ').slice(1);

    if (!args.length) {
      return bot.sendMessage(userId, 'Usage : !manga <titre> pour rechercher un manga.');
    }

    const command = args[0].toLowerCase();

    // Lire un chapitre
    if (command === 'lire') {
      const chapterIndex = parseInt(args[1], 10) - 1;
      if (isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= cachedChapters.length) {
        return bot.sendMessage(userId, 'Numéro de chapitre invalide.');
      }
      const chapter = cachedChapters[chapterIndex];
      if (!chapter.pages || !chapter.pages.length) return bot.sendMessage(userId, 'Aucune page trouvée.');

      for (const page of chapter.pages) {
        await bot.sendMessage(userId, page); // PageBot supporte juste du texte ou URL image simple
      }
      return;
    }

    // Voir les chapitres
    if (command === 'chap') {
      const mangaIndex = parseInt(args[1], 10) - 1;
      if (isNaN(mangaIndex) || mangaIndex < 0 || mangaIndex >= cachedMangas.length) {
        return bot.sendMessage(userId, 'Numéro de manga invalide.');
      }
      const manga = cachedMangas[mangaIndex];

      try {
        const res = await axios.get(`https://miko-utilis.vercel.app/api/manga-chapters?mangaId=${manga.id}`);
        const chapters = res.data.data.results || [];
        cachedChapters = chapters.map(ch => ({ title: ch.title, pages: ch.pages }));

        const list = chapters.map((ch, i) => `${i + 1}. ${ch.title}`).join('\n');
        return bot.sendMessage(userId, `Chapitres pour "${manga.title}":\n${list}\nEnvoyez !manga lire <numéro> pour lire.`);
      } catch {
        return bot.sendMessage(userId, 'Erreur lors de la récupération des chapitres.');
      }
    }

    // Recherche manga
    const title = args.join(' ');
    try {
      const res = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(title)}`);
      const mangas = res.data.data.results || [];
      if (!mangas.length) return bot.sendMessage(userId, `Aucun manga trouvé pour "${title}".`);

      cachedMangas = mangas;

      let message = 'Mangas trouvés :\n';
      mangas.forEach((m, i) => {
        message += `${i + 1}. ${m.title} - ${m.cover}\n`; // Page Bot peut afficher l'image URL
      });
      message += '\nRépondez avec !manga chap <numéro> pour voir les chapitres du manga choisi.';
      return bot.sendMessage(userId, message);
    } catch {
      return bot.sendMessage(userId, 'Erreur lors de la recherche du manga.');
    }
  },
};
