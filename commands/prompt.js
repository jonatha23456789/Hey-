const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a prompt based on the replied image',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, repliedMessage) {
    // Vérifier si un message a été replyé
    if (!repliedMessage) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please reply to an image to generate a prompt.' },
        pageAccessToken
      );
    }

    // Récupérer l'URL de l'image dans différents chemins possibles
    let imageUrl = null;
    try {
      if (repliedMessage.attachments && repliedMessage.attachments[0]?.type === 'image') {
        imageUrl = repliedMessage.attachments[0].payload.url;
      } else if (repliedMessage.message?.attachments && repliedMessage.message.attachments[0]?.type === 'image') {
        imageUrl = repliedMessage.message.attachments[0].payload.url;
      }
    } catch (err) {
      console.error('Error reading image URL:', err);
    }

    if (!imageUrl) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please reply to an image to generate a prompt.' },
        pageAccessToken
      );
    }

    // Appel à l'API
    const apiUrl = `https://nova-apis.onrender.com/prompt?image=${encodeURIComponent(imageUrl)}`;

    try {
      const { data } = await axios.get(apiUrl);
      if (!data || !data.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt from this image.' },
          pageAccessToken
        );
      }

      // Envoyer le prompt généré
      await sendMessage(
        senderId,
        { text: `🖼️ Prompt Generated:\n\n${data.prompt}` },
        pageAccessToken
      );

    } catch (error) {
      console.error('Prompt Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while generating the prompt.' },
        pageAccessToken
      );
    }
  }
};
