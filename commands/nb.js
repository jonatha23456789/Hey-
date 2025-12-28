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
      { text: '🍌 Generating Nano-Banana image, please wait (20-30s)...' },
      pageAccessToken
    );

    try {
      const replyImage = getReplyImage(event);

      // ✅ Params propres
      const params = { prompt };
      if (replyImage) params.imageUrl = replyImage;

      const { data } = await axios.get(
        'https://api.nekolabs.web.id/img.gen/nano-banana',
        {
          params,
          timeout: 60000 // ⏱️ IMPORTANT
        }
      );

      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed (empty result).' },
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
              url: data.result,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('NanoBanana API Error:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Nano-Banana API timeout or error. Try again.' },
        pageAccessToken
      );
    }
  }
};
