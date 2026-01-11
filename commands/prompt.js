const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a detailed AI prompt from image (reply)',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, event) {
    try {
      /* =====================
         📸 Vérifier reply image
         ===================== */
      const mid = event?.message?.reply_to?.mid;
      if (!mid) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an IMAGE.' },
          pageAccessToken
        );
      }

      /* =====================
         📥 Récupérer image URL
         ===================== */
      let imageUrl = null;

      const { data } = await axios.get(
        `https://graph.facebook.com/v19.0/${mid}/attachments`,
        { params: { access_token: pageAccessToken } }
      );

      if (data?.data?.length > 0) {
        imageUrl =
          data.data[0]?.image_data?.url ||
          data.data[0]?.payload?.url ||
          null;
      }

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Could not extract image from the replied message.' },
          pageAccessToken
        );
      }

      /* =====================
         🧠 IMAGE → PROMPT (TON API)
         ===================== */
      const { data: apiRes } = await axios.get(
        'https://arychauhann.onrender.com/api/imagepromptguru',
        {
          params: {
            imageUrl,
            model: 'gemini-2.5-pro',
            lang: 'en'
          },
          timeout: 30000
        }
      );

      if (!apiRes?.success || !apiRes?.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt from image.' },
          pageAccessToken
        );
      }

      /* =====================
         📤 Envoi résultat
         ===================== */
      const message =
`🖼️ | Image → AI Prompt
・────────────・
${apiRes.prompt}
・────────────・`;

      await sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error('Prompt Command Error:', error.response?.data || error.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating prompt.' },
        pageAccessToken
      );
    }
  }
};
