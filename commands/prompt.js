const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a detailed AI prompt from image by reply',
  usage: '-prompt (reply to an image)',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken, event) {
    try {
      /* =====================
         📸 Récupérer image du reply
         ===================== */
      const mid = event?.message?.reply_to?.mid;
      if (!mid) {
        return sendMessage(
          senderId,
          { text: '⚠️ Please reply to an IMAGE.' },
          pageAccessToken
        );
      }

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
          { text: '❌ Failed to read image from reply.' },
          pageAccessToken
        );
      }

      /* =====================
         🧠 PROMPT TEXTE (pour nova)
         ===================== */
      const promptText =
`Generate a detailed AI image generation prompt based on this image.

Image URL:
${imageUrl}

The prompt must include:
- subject
- style (anime / realistic / cinematic if applicable)
- colors
- lighting
- camera angle
- mood
- background
- level of detail

Return ONLY the final prompt text.`;

      /* =====================
         🔥 APPEL NOVA (TEXT ONLY)
         ===================== */
      const { data: result } = await axios.get(
        `https://nova-apis.onrender.com/prompt?prompt=${encodeURIComponent(promptText)}`,
        { timeout: 25000 }
      );

      if (!result?.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt.' },
          pageAccessToken
        );
      }

      const reply =
`🖼️ | Image → AI Prompt
・────────────・
${result.prompt}
・────────────・`;

      await sendMessage(senderId, { text: reply }, pageAccessToken);

    } catch (err) {
      console.error('Prompt Error:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating prompt.' },
        pageAccessToken
      );
    }
  }
};
