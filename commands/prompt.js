const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a prompt based on the replied image',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, repliedMessage) {
    try {
      // Vérifie si on a bien reply à quelque chose
      if (!repliedMessage) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an image to generate a prompt.' },
          pageAccessToken
        );
      }

      // Cherche l'image dans différents chemins possibles
      let imageUrl = null;

      if (repliedMessage.attachments && repliedMessage.attachments.length > 0) {
        const attachment = repliedMessage.attachments.find(att => att.type === 'image');
        if (attachment) imageUrl = attachment.payload.url;
      }

      // Si l'image est dans repliedMessage.message
      if (!imageUrl && repliedMessage.message?.attachments?.length > 0) {
        const attachment = repliedMessage.message.attachments.find(att => att.type === 'image');
        if (attachment) imageUrl = attachment.payload.url;
      }

      // Si l'image est dans repliedMessage.reply_to
      if (!imageUrl && repliedMessage.reply_to?.attachments?.length > 0) {
        const attachment = repliedMessage.reply_to.attachments.find(att => att.type === 'image');
        if (attachment) imageUrl = attachment.payload.url;
      }

      // Si aucune image n'est trouvée
      if (!imageUrl) {
        console.log('No image found in repliedMessage:', JSON.stringify(repliedMessage, null, 2));
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an image to generate a prompt.' },
          pageAccessToken
        );
      }

      // Appel API
      const apiUrl = `https://nova-apis.onrender.com/prompt?image=${encodeURIComponent(imageUrl)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt from this image.' },
          pageAccessToken
        );
      }

      // Envoie le prompt formaté
      await sendMessage(
        senderId,
        {
          text: `🖼️ *Prompt Generated Successfully!*\n\n${data.prompt}`,
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Prompt Command Error:', error);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while generating the prompt.' },
        pageAccessToken
      );
    }
  }
};
