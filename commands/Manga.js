const axios = require('axios');
const fs = require('fs');
const { sendMessage } = require('../handles/sendMessage');

const token = fs.readFileSync('token.txt', 'utf8');

let cachedMangas = [];   // Stocke les mangas recherchés
let cachedChapters = []; // Stocke les chapitres du manga choisi

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',
  author: 'Tata',

  async execute(senderId, args) {
    if (!args.length) {
      await sendMessage(
        senderId,
        { text: 'Utilisation : `!manga <titre>` pour rechercher un manga ou `!manga lire <numéro>` pour lire un chapitre.' },
        token
      );
      return;
    }

    const command = args[0].toLowerCase();

    // Commande pour lire un chapitre
    if (command === 'lire') {
      const chapterIndex = parseInt(args[1], 10) - 1;
      if (isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= cachedChapters.length) {
        await sendMessage(senderId, { text: 'Numéro de chapitre invalide.' }, token);
        return;
      }

      const chapter = cachedChapters[chapterIndex];

      try {
        // Envoi de toutes les images du chapitre
        for (const imgUrl of chapter.images) {
          await sendMessage(senderId, {
            attachment: { type: 'image', payload: { url: imgUrl } }
          }, token);
        }

        await sendMessage(senderId, { text: `Chapitre ${chapter.number} envoyé !` }, token);
      } catch (err) {
        console.error('Erreur lecture chapitre:', err.message);
        await sendMessage(senderId, { text: 'Impossible d’envoyer ce chapitre.' }, token);
      }

      return;
    }

    // Recherche de manga par titre
    const query = args.join(' ');
    const apiUrl = `https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data.results.length) {
        await sendMessage(senderId, { text: `Aucun manga trouvé pour "${query}".` }, token);
        return;
      }

      cachedMangas = data.data.results;

      // Envoi des mangas trouvés avec leurs couvertures
      for (let i = 0; i < cachedMangas.length; i++) {
        const manga = cachedMangas[i];
        await sendMessage(senderId, {
          text: `${i + 1}. ${manga.title}`,
          attachment: { type: 'image', payload: { url: manga.cover } }
        }, token);
      }

      await sendMessage(senderId, { text: 'Répondez avec `!manga chap <numéro>` pour voir les chapitres du manga choisi.' }, token);

    } catch (err) {
      console.error('Erreur recherche manga:', err.message);
      await sendMessage(senderId, { text: 'Erreur lors de la recherche du manga.' }, token);
    }
  }
};
