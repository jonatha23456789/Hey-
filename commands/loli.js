const axios = require('axios');
const fs = require('fs');
const { sendMessage } = require('../handles/sendMessage');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'loli',
  description: 'Send random loli pic',
  author: 'Hk',

  async execute(senderId) {
    const pageAccessToken = token;

    try {
      // Message temporaire
      await sendMessage(senderId, { text: '🕐 Chargement de ton image mignonne...' }, pageAccessToken);

      // Requête API (obtenir le lien direct)
      const res = await axios.get('https://archive.lick.eu.org/api/random/loli', { responseType: 'arraybuffer' });

      // Vérifier si on a bien reçu une image
      if (!res.data) {
        return await sendMessage(senderId, { text: '❌ Impossible de récupérer une image.' }, pageAccessToken);
      }

      // Envoyer l’image directement sous forme d’attachement
      const imageBase64 = Buffer.from(res.data).toString('base64');
      const imageMessage = {
        attachment: {
          type: 'image',
          payload: {
            is_reusable: true,
          },
        },
        filedata: imageBase64
      };

      await sendMessage(senderId, imageMessage, pageAccessToken);

    } catch (error) {
      console.error('Erreur Loli:', error.message || error);
      await sendMessage(senderId, { text: '⚠️ Une erreur est survenue lors du chargement de l’image.' }, pageAccessToken);
    }
  }
};
