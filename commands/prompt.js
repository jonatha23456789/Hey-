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

      // 📸 Récupération image depuis reply
      if (
        repliedMessage.message &&
        repliedMessage.message.reply_to &&
        repliedMessage.message.reply_to.mid
      ) {
        const replyMid = repliedMessage.message.reply_to.mid;
        const graphUrl = `https://graph.facebook.com/v17.0/${replyMid}?fields=attachments&access_token=${pageAccessToken}`;

        const { data: messageData } = await axios.get(graphUrl);

        if (
          messageData?.attachments?.data?.length
        ) {
          const attachment = messageData.attachments.data.find(
            att => att.mime_type && att.mime_type.startsWith('image/')
          );

          if (attachment?.image_data?.url) {
            imageUrl = attachment.image_data.url;
          } else if (attachment?.payload?.url) {
            imageUrl = attachment.payload.url;
          }
        }
      }

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an IMAGE to generate a prompt.' },
          pageAccessToken
        );
      }

      // 🔥 NOUVELLE API img → prompt
      const { data } = await axios.get(
        'https://estapis.onrender.com/api/ai/img2prompt/v8',
        {
          params: { image: imageUrl },
          timeout: 30000
        }
      );

      // ✅ Sécurité parsing
      const prompt =
        data?.prompt ||
        data?.result ||
        data?.data?.prompt ||
        data?.data?.text;

      if (!prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt from this image.' },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        {
          text:
`🖼️ | Image → Prompt
・────────────・
${prompt}
・──── >ᴗ< ─────・`
        },
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
