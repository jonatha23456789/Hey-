const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 📸 Image depuis reply
function getReplyImage(event) {
  return event?.message?.reply_to?.message?.attachments?.[0]?.type === 'image'
    ? event.message.reply_to.message.attachments[0].payload?.url
    : null;
}

module.exports = {
  name: 'nanobanana',
  description: 'Generate anime images using Nano-Banana AI 🍌',
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
      { text: '🍌 Generating Nano-Banana image, please wait (20-40s)...' },
      pageAccessToken
    );

    try {
      const imageUrlReply = getReplyImage(event);

      const response = await axios.get(
        'https://api.nekolabs.web.id/img.gen/nano-banana',
        {
          params: {
            prompt,
            imageUrl: imageUrlReply || ''
          },
          responseType: 'stream', // 🔥 OBLIGATOIRE
          timeout: 90000 // ⏱️ 90 secondes
        }
      );

      // ✅ URL FINALE APRÈS REDIRECTION
      const imageUrl = response.request?.res?.responseUrl;

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed (no redirect URL).' },
          pageAccessToken
        );
      }

      const deco = '・───── 🍌 ─────・';

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

      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('NanoBanana Error:', err.message || err);
      await sendMessage(
        senderId,
        { text: '❌ Nano-Banana generation failed. Try again.' },
        pageAccessToken
      );
    }
  }
};
