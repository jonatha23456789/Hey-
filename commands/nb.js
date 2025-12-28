const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 📸 Image depuis reply (OPTIONNELLE)
function getReplyImage(event) {
  const att = event?.message?.reply_to?.message?.attachments?.[0];
  if (att?.type === 'image') {
    return att.payload?.url;
  }
  return null;
}

module.exports = {
  name: 'nanobanana',
  description: 'Generate anime images with Nano-Banana AI 🍌',
  usage: '-nanobanana <prompt>',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-nanobanana <prompt>' },
        pageAccessToken
      );
    }

    await sendMessage(
      senderId,
      { text: '🍌 Generating Nano-Banana image, please wait (20–40s)...' },
      pageAccessToken
    );

    try {
      const imageUrl = getReplyImage(event);

      // ✅ PARAMS PROPRES
      const params = { prompt };
      if (imageUrl) params.imageUrl = imageUrl;

      const { data } = await axios.get(
        'https://api.nekolabs.web.id/img.gen/nano-banana',
        {
          params,
          timeout: 120000 // ⏱ 2 MINUTES
        }
      );

      // ✅ FORMAT OFFICIEL
      if (!data || data.success !== true || !data.result) {
        console.error('NanoBanana API Response:', data);
        return sendMessage(
          senderId,
          { text: '❌ Nano-Banana API returned no image.' },
          pageAccessToken
        );
      }

      const imageResult = data.result;
      const deco = '・───── 🍌 ─────・';

      // 📝 TEXTE
      await sendMessage(
        senderId,
        {
          text:
`${deco}
🍌 | Nano-Banana AI

🖌 Prompt:
${prompt}
${deco}`
        },
        pageAccessToken
      );

      // 🖼 IMAGE
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: imageResult,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('NanoBanana ERROR:', err?.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Nano-Banana failed (server slow or busy). Retry in 1–2 min.' },
        pageAccessToken
      );
    }
  }
};
