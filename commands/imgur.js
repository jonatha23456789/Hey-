const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

async function getImageUrl(event, token) {
  const mid = event?.message?.reply_to?.mid;
  if (!mid) return null;

  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: token }
    });
    return data?.data?.[0]?.image_data?.url || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l’image:', error.message);
    return null;
  }
}

module.exports = {
  name: 'imgur',
  description: 'Upload image to imgbb',
  author: 'Hk',
  usage: '-imgbb (reply to an image)',

  async execute(senderId, args, pageAccessToken, event) {
    const imageUrl = await getImageUrl(event, pageAccessToken);
    if (!imageUrl) {
      return sendMessage(senderId, { text: '⚠️ Veuillez répondre à une image à uploader.' }, pageAccessToken);
    }

    const apiUrl = `https://arychauhann.onrender.com/api/imgbb?url=${encodeURIComponent(imageUrl)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data.status) {
        return sendMessage(senderId, { text: '❌ Échec de l’upload vers Imgbb.' }, pageAccessToken);
      }

      const result = data.result;

      const info = `✅ **Image uploadée avec succès !**\n\n` +
        `🆔 **ID :** ${result.id}\n` +
        `📄 **Titre :** ${result.title}\n` +
        `🌐 **Lien direct :** ${result.url}\n` +
        `👀 **Voir sur Imgbb :** ${result.url_viewer}\n` +
        `🗑️ **Supprimer :** ${result.delete_url}`;

      // Envoi de l'image uploadée
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: result.url,
            is_reusable: true
          }
        }
      }, pageAccessToken);

      // Envoi des détails
      await sendMessage(senderId, { text: info }, pageAccessToken);

    } catch (error) {
      console.error('Erreur lors de l’upload Imgbb:', error.message);
      sendMessage(senderId, { text: '🚨 Une erreur est survenue lors de l’upload.' }, pageAccessToken);
    }
  }
};
