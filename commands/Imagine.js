const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using MidJanuary API (supports reply to image)',
  usage: '-imagine <prompt> [1:1 | 16:9 | 9:16]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, imageCache) {
    if (!args.length && !event?.message?.reply_to) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-imagine <prompt> [1:1 | 16:9 | 9:16]\nOr reply to an image with -imagine <prompt>' },
        pageAccessToken
      );
    }

    // 🎯 Ratio
    let ratio = '1:1';
    const ratioMatch = args.join(' ').match(/\b(1:1|16:9|9:16)\b$/);
    if (ratioMatch) {
      ratio = ratioMatch[0];
      args.pop();
    }

    const prompt = args.join(' ').trim();

    // 🔍 Image depuis reply si disponible
    const replyImage =
      event?.message?.reply_to?.message?.attachments?.[0]?.type === 'image'
        ? event.message.reply_to.message.attachments[0].payload?.url
        : null;

    // 🔍 Sinon image depuis cache
    const cachedImg = imageCache?.get(senderId)?.url;

    const imageUrl = replyImage || cachedImg || '';

    await sendMessage(
      senderId,
      { text: '🎨 Generating image, please wait...' },
      pageAccessToken
    );

    try {
      const apiUrl = 'https://midjanuarybyxnil.onrender.com/imagine';
      const { data } = await axios.get(apiUrl, {
        params: { prompt, ratio, imageUrl }
      });

      const generatedUrl = data?.result;
      if (!generatedUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';

      // 🖼️ Envoyer image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: generatedUrl,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

      // 📝 Envoyer texte décoré
      await sendMessage(
        senderId,
        {
          text:
`${deco}
🎨 | AI Image Generated

🖌 Prompt:
${prompt}

📐 Ratio: ${ratio}
${deco}`
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Imagine Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating the image.' },
        pageAccessToken
      );
    }
  }
};
