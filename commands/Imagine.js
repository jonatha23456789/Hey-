const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using MidJanuary API',
  usage: '-imagine <prompt> [ratio 1:1 | 16:9 | 9:16]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-imagine <prompt> [1:1 | 16:9 | 9:16]' },
        pageAccessToken
      );
    }

    // 🎯 Détection ratio
    let ratio = '1:1';
    const ratioMatch = args.join(' ').match(/\b(1:1|16:9|9:16)\b$/);
    if (ratioMatch) {
      ratio = ratioMatch[1];
      args.pop();
    }

    const prompt = args.join(' ').trim();

    await sendMessage(
      senderId,
      { text: '🎨 Generating your AI image, please wait...' },
      pageAccessToken
    );

    try {
      const apiUrl = 'https://midjanuarybyxnil.onrender.com/imagine';

      const { data } = await axios.get(apiUrl, {
        params: {
          prompt,
          ratio
        }
      });

      // 🔍 récupération image URL (multi-format)
      const imageUrl =
        data?.image ||
        data?.result ||
        data?.url ||
        data?.data?.image;

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';

      // 📝 message + image
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
      console.error('Imagine Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating the image.' },
        pageAccessToken
      );
    }
  }
};
