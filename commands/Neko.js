const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'neko',
  description: 'Envoie une image de neko.',
  usage: '-neko',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    try {
      // Appel à l'API nekos.life pour obtenir une image de neko
      const response = await axios.get('https://nekos.life/api/v2/img/neko');
      const imageUrl = response.data.url;

      // Envoi de l'image à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true
          }
        }
      }, pageAccessToken);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'image neko:', error.message);
      sendMessage(senderId, { text: '❌ Impossible de récupérer une image de neko.' }, pageAccessToken);
    }
  }
};
