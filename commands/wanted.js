const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'wanted',
  description: 'Envoie une image "WANTED" de toi',
  usage: '-wanted',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    try {
      // 🔹 Utiliser l'ID de l'utilisateur pour l'API
      const userId = senderId; // prend l'ID du sender
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/wanted?userid=${encodeURIComponent(userId)}`;

      // 🔹 Appel API
      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      if (!data?.results?.url) {
        return sendMessage(
          senderId,
          { text: '❌ Impossible de générer l’image WANTED.' },
          pageAccessToken
        );
      }

      const imageUrl = data.results.url;

      // 🔹 Envoi de l'image sur Messenger
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: imageUrl, is_reusable: true },
          },
        },
        pageAccessToken
      );

      // 🔹 Message complémentaire
      await sendMessage(
        senderId,
        { text: '🎯 Voici ton image WANTED !' },
        pageAccessToken
      );

    } catch (err) {
      console.error('WANTED Command Error:', err.message || err);
      await sendMessage(
        senderId,
        { text: '🚨 Une erreur est survenue lors de la génération de l’image.' },
        pageAccessToken
      );
    }
  },
};
