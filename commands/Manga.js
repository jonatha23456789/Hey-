const axios = require('axios');

let cachedMangas = [];
let cachedChapters = [];

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',

  async execute({ message, bot }) {
    // Récupère le texte correctement selon la version de Page Bot
    const text = message.body || message.text || message.message || '';
    const args = text.split(' ').slice(1);
    const senderId = message.sender.id;

    if (!args.length) {
      return bot.sendMessage(senderId, 'Usage : `!manga <titre>` pour rechercher un manga.');
    }

    const command = args[0].toLowerCase();

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

    // Recherche d’un manga
    const title = args.join(' ');
    try {
      const res = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(title)}`);
      const mangas = res.data.data.results || [];
      if (!mangas.length) return bot.sendMessage(senderId, `Aucun manga trouvé pour "${title}".`);

      cachedMangas = mangas;

      let msg = `Mangas trouvés pour "${title}" :\n\n`;
      mangas.forEach((m, i) => {
        msg += `${i + 1}. ${m.title}\n${m.cover}\n\n`;
      });
      msg += 'Répondez avec `!manga chap <numéro>` pour voir les chapitres du manga choisi.';

      return bot.sendMessage(senderId, msg);
    } catch (err) {
      return bot.sendMessage(senderId, 'Erreur lors de la recherche du manga.');
    }
  },
};
