const axios = require('axios');
const fs = require('fs');
const { sendMessage } = require('../handles/sendMessage');

const token = fs.readFileSync('token.txt', 'utf8');
let cachedChapters = []; // Stocke les chapitres récupérés après une recherche

// Fonction pour rechercher un manga par titre
const searchMangaByTitle = async (title) => {
  try {
    const response = await axios.get('https://miko-utilis.vercel.app/api/manga-search', {
      params: { search: title },
    });

    if (!response.data.status || !response.data.data.results) return [];

    return response.data.data.results.map((manga) => ({
      id: manga.id,
      title: manga.title,
      cover: manga.cover,
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche de manga:', error.message);
    throw new Error('Impossible de trouver des mangas correspondant à ce titre.');
  }
};

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',
  author: 'Tata',

  async execute(event, args) {
    const senderId = event.sender?.id || event.userId || event.chat?.id;
    if (!senderId) {
      console.error('Impossible de récupérer l\'ID de l\'utilisateur !');
      return;
    }

    if (!args || args.length === 0) {
      await sendMessage(
        senderId,
        { text: 'Utilisation : `!manga <titre>` pour rechercher un manga ou `!manga lire <numéro>` pour voir un manga.' },
        token
      );
      return;
    }

    const command = args[0].toLowerCase();

    if (command === 'lire') {
      const index = parseInt(args[1], 10) - 1;

      if (isNaN(index) || index < 0 || index >= cachedChapters.length) {
        await sendMessage(
          senderId,
          { text: 'Veuillez entrer un numéro de manga valide parmi les mangas listés.' },
          token
        );
        return;
      }

      const manga = cachedChapters[index];

      // Envoi de la cover du manga
      await sendMessage(
        senderId,
        { text: `Lecture du manga : ${manga.title}` },
        token
      );

      await sendMessage(
        senderId,
        { attachment: { type: 'image', payload: { url: manga.cover } } },
        token
      );

    } else {
      // Recherche de manga
      const title = args.join(' ');

      try {
        const mangas = await searchMangaByTitle(title);

        if (mangas.length === 0) {
          await sendMessage(
            senderId,
            { text: `Aucun manga trouvé pour le titre "${title}".` },
            token
          );
          return;
        }

        cachedChapters = mangas; // Stocke les mangas pour la commande lire

        const mangaList = mangas
          .map((m, i) => `${i + 1}. ${m.title}`)
          .join('\n');

        await sendMessage(
          senderId,
          { text: `Mangas trouvés :\n\n${mangaList}\n\nRépondez avec \`!manga lire <numéro>\` pour voir le manga choisi.` },
          token
        );

      } catch (error) {
        console.error('Erreur dans la commande manga:', error.message);
        await sendMessage(
          senderId,
          { text: 'Impossible de récupérer les mangas.' },
          token
        );
      }
    }
  },
};
