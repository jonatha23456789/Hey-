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
      { text: '🍌 Generating Nano-Banana image, please wait...' },
      pageAccessToken
    );

    try {
      const imageUrl = getReplyImage(event);

      const apiUrl = 'https://api.nekolabs.web.id/img.gen/nano-banana';

      const { data } = await axios.get(apiUrl, {
        params: {
          prompt,
          imageUrl: imageUrl || undefined
        }
      });

      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed.' },
          pageAccessToken
        );
      }

      const resultImage = data.result;
      const deco = '・───── 🍌 ─────・';

      // 📝 Message info
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

      // 🖼️ Image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: resultImage,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('NanoBanana Error:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating image.' },
        pageAccessToken
      );
    }
  }
};
