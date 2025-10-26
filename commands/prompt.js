const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a prompt based on the replied image',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, repliedMessage) {
    try {
      if (!repliedMessage) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an image to generate a prompt.' },
          pageAccessToken
        );
      }

      let imageUrl = null;

      // ✅ Si c’est un reply sans pièce jointe directe, on va chercher l’image d’origine
      if (
        repliedMessage.message &&
        repliedMessage.message.reply_to &&
        repliedMessage.message.reply_to.mid
      ) {
        const replyMid = repliedMessage.message.reply_to.mid;
        const graphUrl = `https://graph.facebook.com/v17.0/${replyMid}?fields=attachments&access_token=${pageAccessToken}`;

        const { data: messageData } = await axios.get(graphUrl);

        if (
          messageData &&
          messageData.attachments &&
          messageData.attachments.data &&
          messageData.attachments.data.length > 0
        ) {
          const attachment = messageData.attachments.data.find(
            (att) => att.mime_type && att.mime_type.startsWith('image/')
          );
          if (attachment && attachment.image_data && attachment.image_data.url) {
            imageUrl = attachment.image_data.url;
          } else if (attachment && attachment.payload && attachment.payload.url) {
            imageUrl = attachment.payload.url;
          }
        }
      }

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an image to generate a prompt.' },
          pageAccessToken
        );
      }

      // 🔥 Appel API externe
      const apiUrl = `https://nova-apis.onrender.com/prompt?image=${encodeURIComponent(imageUrl)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt from this image.' },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        { text: `🖼️ *Prompt Generated Successfully!*\n\n${data.prompt}` },
        pageAccessToken
      );
    } catch (error) {
      console.error('Prompt Command Error:', error.response?.data || error.message);
      await sendMessage(
        senderId,
        { text: '❌ An error occurred while generating the prompt.' },
        pageAccessToken
      );
    }
  },
};
