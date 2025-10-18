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
      // Envoi du message "loading"
      const loadingMsg = await sendMessage(
        senderId,
        { text: '🎀 Fetching a cute random loli...' },
        pageAccessToken
      );

      // Récupère l’ID du message envoyé (si disponible)
      loadingMsgId = loadingMsg?.message_id || null;

      // Appel de l’API
      const apiUrl = 'https://archive.lick.eu.org/api/random/loli';
      const { data } = await axios.get(apiUrl);

      const imageUrl =
        typeof data === 'string'
          ? data
          : data.url || data.image || null;

      if (!imageUrl) {
        await sendMessage(
          senderId,
          { text: '❌ Failed to fetch loli image.' },
          pageAccessToken
        );
        return;
      }

      // Envoi de l'image
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

      // Supprime le message "loading" après succès
      if (loadingMsgId) {
        await deleteMessage(senderId, loadingMsgId, pageAccessToken);
      }

    } catch (error) {
      console.error('❌ Loli Command Error:', error.message || error);

      await sendMessage(
        senderId,
        { text: '⚠️ An error occurred while fetching loli image.' },
        pageAccessToken
      );

      // Supprime le message "loading" en cas d’erreur
      if (loadingMsgId) {
        await deleteMessage(senderId, loadingMsgId, pageAccessToken);
      }
    }
  },
};
