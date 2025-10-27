const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

let cachedMangas = []; // Stocke les mangas de la dernière recherche

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas avec boutons interactifs',
  author: 'Tata',

  async execute(senderId, args) {
    if (!args.length) {
      await sendMessage(senderId, {
        text: 'Utilisation : !manga <titre> pour rechercher un manga.'
      });
      return;
    }

    const query = args.join(' ');

    try {
      const response = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(query)}`);
      const data = response.data;

      if (!data.status || !data.data.results.length) {
        await sendMessage(senderId, { text: `Aucun manga trouvé pour "${query}".` });
        return;
      }

      cachedMangas = data.data.results.slice(0, 5); // Stocke les 5 premiers résultats max

      // Création du message avec boutons
      const buttons = cachedMangas.map((manga, index) => ({
        type: 'postback',
        title: manga.title,
        payload: `manga_chapters_${index}`
      }));

      await sendMessage(senderId, {
        text: `Résultats pour "${query}" :\nChoisis un manga pour voir ses chapitres.`,
        buttons
      });

    } catch (err) {
      console.error('Erreur API manga:', err.message);
      await sendMessage(senderId, { text: 'Impossible de récupérer les mangas pour le moment.' });
    }
  },

  // Fonction pour gérer les boutons
  async handlePostback(senderId, payload) {
    if (!payload.startsWith('manga_chapters_')) return;

    const index = parseInt(payload.split('_').pop(), 10);
    const manga = cachedMangas[index];

    if (!manga) {
      await sendMessage(senderId, { text: 'Manga introuvable.' });
      return;
    }

    // Ici on simule les chapitres (tu peux remplacer par un vrai appel API)
    const chapters = Array.from({ length: 5 }, (_, i) => `Chapitre ${i + 1}`);

    let messageText = `Chapitres disponibles pour "${manga.title}" :\n\n`;
    chapters.forEach((ch, i) => {
      messageText += `${i + 1}. ${ch}\n`;
    });

    await sendMessage(senderId, { text: messageText });
  }
};
