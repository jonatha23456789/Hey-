const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a prompt based on the replied image',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, repliedMessage) {
    try {
      if (!repliedMessage || !repliedMessage.attachments || repliedMessage.attachments.length === 0) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an image to generate a prompt.' },
          pageAccessToken
        );
      }

      // Récupération de l'URL de l'image
      let imageUrl = null;
      const attachment = repliedMessage.attachments[0];

      if (attachment.payload?.url) imageUrl = attachment.payload.url;
      else if (attachment.image_url) imageUrl = attachment.image_url;
      else if (attachment.payload?.attachments?.[0]?.url) imageUrl = attachment.payload.attachments[0].url;

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '⚠️ Could not detect an image in the replied message.' },
          pageAccessToken
        );
      }

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
        { text: `✨ Generated Prompt:\n\n${data.prompt}` },
        pageAccessToken
      );

    } catch (error) {
      console.error('Prompt Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '🚨 An error occurred while generating the prompt.' },
        pageAccessToken
      );
    }
  }
};
