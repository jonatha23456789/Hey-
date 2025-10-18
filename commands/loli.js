const axios = require('axios');
const { sendMessage, deleteMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'loli',
  description: 'Send a random loli image',
  author: 'Hk',
  usage: '-loli',

  async execute(senderId, args, pageAccessToken) {
    let loadingMsgId = null;

    try {
      // Envoi du message de chargement
      const loadingMsg = await sendMessage(
        senderId,
        { text: '🎀 Fetching a cute random loli...' },
        pageAccessToken
      );

      loadingMsgId = loadingMsg?.message_id || null;

      // Requête API
      const apiUrl = 'https://archive.lick.eu.org/api/random/loli';
      const response = await axios.get(apiUrl, { responseType: 'json' });

      // Vérifie le contenu reçu
      let imageUrl;

      if (typeof response.data === 'string') {
        imageUrl = response.data; // L’API renvoie juste l’URL directe
      } else if (response.data?.url) {
        imageUrl = response.data.url;
      } else if (response.data?.image) {
        imageUrl = response.data.image;
      } else {
        imageUrl = response.request.res.responseUrl || null; // En cas de redirection
      }

      if (!imageUrl) {
        await sendMessage(
          senderId,
          { text: '❌ Failed to fetch loli image.' },
          pageAccessToken
        );
        return;
      }

      // Envoi de l’image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: imageUrl },
          },
        },
        pageAccessToken
      );

      // Supprime le message "loading"
      if (loadingMsgId) {
        await deleteMessage(senderId, loadingMsgId, pageAccessToken);
      }

    } catch (error) {
      console.error('❌ Loli Command Error:', error.message || error);

      await sendMessage(
        senderId,
        { text: '⚠️ An error occurred while fetching the image.' },
        pageAccessToken
      );

      if (loadingMsgId) {
        await deleteMessage(senderId, loadingMsgId, pageAccessToken);
      }
    }
  },
};
