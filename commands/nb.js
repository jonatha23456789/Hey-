const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 📸 Image OBLIGATOIRE depuis reply
function getReplyImage(event) {
  const att = event?.message?.reply_to?.message?.attachments?.[0];
  if (att?.type === 'image') {
    return att.payload?.url;
  }
  return null;
}

module.exports = {
  name: 'nanobanana',
  description: 'Generate Nano-Banana AI images (image required 🍌)',
  usage: '-nanobanana <prompt> (reply to an image)',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-nanobanana <prompt>\n(reply to an image)' },
        pageAccessToken
      );
    }

    // ❌ IMAGE OBLIGATOIRE
    const imageUrl = getReplyImage(event);
    if (!imageUrl) {
      return sendMessage(
        senderId,
        { text: '❌ Please reply to an image before using Nano-Banana.' },
        pageAccessToken
      );
    }

    await sendMessage(
      senderId,
      { text: '🍌 Generating Nano-Banana image, please wait (20–40s)...' },
      pageAccessToken
    );

    try {
      const { data } = await axios.get(
        'https://api.nekolabs.web.id/img.gen/nano-banana',
        {
          params: {
            prompt,
            imageUrl
          },
          timeout: 120000 // ⏱ 2 minutes
        }
      );

      if (!data?.success || !data?.result) {
        console.error('NanoBanana API:', data);
        return sendMessage(
          senderId,
          { text: '❌ Nano-Banana generation failed (empty result).' },
          pageAccessToken
        );
      }

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
              url: data.result,
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
        { text: '❌ Nano-Banana API error (server busy). Try again later.' },
        pageAccessToken
      );
    }
  }
};
