const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'loli',
  description: 'Send random loli pic',
  author: 'Hk',

  async execute(senderId) {
    const pageAccessToken = token;

    try {
      // Message temporaire
      const loadingMsg = await sendMessage(senderId, { text: '🕐 Chargement de ton image mignonne...' }, pageAccessToken);

      // Requête API
      const res = await axios.get('https://archive.lick.eu.org/api/random/loli');
      const imageUrl = res.data?.url || res.data?.image || res.data;

      if (!imageUrl) {
        await sendMessage(senderId, { text: '❌ Impossible de récupérer une image.' }, pageAccessToken);
        return;
      }

      // Supprimer le message de chargement
      if (loadingMsg && loadingMsg.message_id) {
        await sendMessage(senderId, { text: '', message_id: loadingMsg.message_id }, pageAccessToken);
      }

      // Envoyer l'image
      await sendMessage(senderId, { attachment: imageUrl }, pageAccessToken);

    } catch (error) {
      console.error('Erreur Loli:', error.message || error);
      await sendMessage(senderId, { text: '⚠️ Une erreur est survenue lors du chargement de l’image.' }, pageAccessToken);
    }
  }
};
