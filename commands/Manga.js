const axios = require('axios');

let cachedMangas = []; // Stocke les mangas récupérés après une recherche

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',
  author: 'Tata',

  async execute(event, args) {
    // Récupération sécurisée de l'ID utilisateur
    const userId = event.sender?.id || event.userId || event.chat?.id || event.message?.from?.id;

    if (!userId) {
      console.error('Impossible de récupérer l\'ID de l\'utilisateur !', JSON.stringify(event, null, 2));
      return;
    }

    if (!args || args.length === 0) {
      return sendMessage(userId, 'Utilisation : `!manga <titre>` pour rechercher un manga ou `!manga chap <numéro>` pour lire un chapitre.');
    }

    const command = args[0].toLowerCase();

    if (command === 'chap') {
      // Lire un chapitre d’un manga
      const index = parseInt(args[1], 10) - 1;

      if (isNaN(index) || index < 0 || index >= cachedMangas.length) {
        return sendMessage(userId, 'Veuillez entrer un numéro de manga valide parmi les résultats listés.');
      }

      const manga = cachedMangas[index];

      let message = `Voici le manga choisi : ${manga.title}\n\n`;
      message += `Couverture : ${manga.cover}\n`;

      return sendMessage(userId, message);
    } else {
      // Rechercher un manga
      const title = args.join(' ');

      try {
        const response = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(title)}`);
        const data = response.data;

        if (!data.status || !data.data || data.data.results.length === 0) {
          return sendMessage(userId, `Aucun manga trouvé pour le titre "${title}".`);
        }

        const mangas = data.data.results;
        cachedMangas = mangas; // Stocke les résultats pour lire après

        let message = `Résultats pour "${title}" :\n\n`;
        mangas.forEach((m, i) => {
          message += `${i + 1}. ${m.title}\n`;
        });

        message += `\nRépondez avec \`!manga chap <numéro>\` pour voir le manga choisi.`;

        return sendMessage(userId, message);
      } catch (err) {
        console.error('Erreur lors de la recherche de manga :', err.message);
        return sendMessage(userId, 'Une erreur est survenue lors de la recherche du manga.');
      }
    }
  },
};

// Fonction pour envoyer un message à l'utilisateur (à adapter selon ton bot)
async function sendMessage(userId, text) {
  // Ici, utilise la méthode de ton bot Page Bot pour envoyer un message
  // Exemple générique : pageBot.sendMessage(userId, text);
  console.log(`Message à ${userId}: ${text}`);
}
