const axios = require('axios');
const fs = require('fs');
const { sendMessage } = require('../handles/sendMessage');

const token = fs.readFileSync('token.txt', 'utf8'); // Token de la page

module.exports = {
  name: 'manga',
  description: 'Recherche et lecture de mangas',
  author: 'Tata',

  async execute(senderId, args) {
    if (!args.length) {
      await sendMessage(
        senderId,
        { text: 'Utilisation : `!manga <titre>` pour rechercher un manga.' },
        token
      );
      return;
    }

    const query = args.join(' ');
    const apiUrl = `https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data.results.length) {
        await sendMessage(
          senderId,
          { text: `Aucun manga trouvé pour "${query}".` },
          token
        );
        return;
      }

      // Crée le message avec la liste des mangas et couvertures
      let messageText = `Résultats pour "${data.data.query}" :\n\n`;
      data.data.results.forEach((manga, index) => {
        messageText += `${index + 1}. ${manga.title}\n${manga.cover}\n\n`;
      });

      await sendMessage(senderId, { text: messageText }, token);

    } catch (error) {
      console.error('Erreur manga cmd:', error.message);
      await sendMessage(
        senderId,
        { text: 'Une erreur est survenue lors de la recherche du manga.' },
        token
      );
    }
  },
};
