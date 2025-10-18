const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'loli',
  description: 'Send 3 random loli images',
  author: 'Hk',
  usage: 'loli',

  async execute(senderId, args) {
    const pageAccessToken = token;

    try {
      // Message de chargement
      const loadingMsg = await sendMessage(senderId, { text: '⏳ Chargement de jolies images...' }, pageAccessToken);

      // Fonction pour obtenir une image depuis l'API
      const getRandomLoli = async () => {
        const res = await axios.get('https://archive.lick.eu.org/api/random/loli');
        return res.data.url || res.data.image || res.data;
      };

      // Récupération de 3 images en parallèle
      const images = await Promise.all([getRandomLoli(), getRandomLoli(), getRandomLoli()]);

      // Envoi des images une par une
      for (const imageUrl of images) {
        if (!imageUrl) continue;
        const imageMessage = {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true,
            },
          },
        };
        await sendMessage(senderId, imageMessage, pageAccessToken);
      }

      // Suppression du message "chargement"
      if (loadingMsg && loadingMsg.message_id) {
        await sendMessage(senderId, { text: '', message_id: loadingMsg.message_id }, pageAccessToken);
      }

      // Message final
      await sendMessage(senderId, { text: '✨ Voici tes images !' }, pageAccessToken);

    } catch (error) {
      console.error('Erreur:', error.message || error);
      await sendMessage(senderId, { text: '❌ Une erreur est survenue lors du chargement des images.' }, pageAccessToken);
    }
  }
};
