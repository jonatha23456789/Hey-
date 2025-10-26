const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a prompt based on the replied image',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, repliedMessage) {
    try {
      // Vérifie si l'utilisateur a reply à une image
      if (!repliedMessage || !repliedMessage.attachments || !repliedMessage.attachments[0]?.payload?.url) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an image to generate a prompt.' },
          pageAccessToken
        );
      }

      const imageUrl = repliedMessage.attachments[0].payload.url;
      const apiUrl = `https://nova-apis.onrender.com/prompt?image=${encodeURIComponent(imageUrl)}`;

      const { data } = await axios.get(apiUrl);

      if (!data || !data.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt from this image.' },
          pageAccessToken
        );
      }

      const promptText = data.prompt;

      // Envoi du prompt généré
      await sendMessage(
        senderId,
        { text: `✨ Generated Prompt:\n\n${promptText}` },
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
