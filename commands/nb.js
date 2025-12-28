const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 📸 Image depuis reply
function getReplyImage(event) {
  return event?.message?.reply_to?.message?.attachments?.[0]?.type === 'image'
    ? event.message.reply_to.message.attachments[0].payload?.url
    : null;
}

module.exports = {
  name: 'nb',
  description: 'Generate anime images using Nano-Banana AI 🍌',
  usage: '-nb <prompt>',
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
      { text: '🍌 Generating Nano-Banana image, please wait (20–30s)...' },
      pageAccessToken
    );

    try {
      const replyImage = getReplyImage(event);

      const { data } = await axios.get(
        'https://api.nekolabs.web.id/img.gen/nano-banana',
        {
          params: {
            prompt,
            imageUrl: replyImage || ''
          },
          timeout: 90000
        }
      );

      // ✅ NOUVEAU FORMAT JSON
      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Nano-Banana API returned empty result.' },
          pageAccessToken
        );
      }

      const imageUrl = data.result;
      const deco = '・───── 🍌 ─────・';

      // 📝 Texte
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

      // 🖼 Image
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

    } catch (error) {
      console.error('NanoBanana Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Nano-Banana generation failed. Try again later.' },
        pageAccessToken
      );
    }
  }
};
