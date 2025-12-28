const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using MidJanuary API',
  usage: '-imagine <prompt> [1:1 | 16:9 | 9:16]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, imageCache) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-imagine <prompt> [1:1 | 16:9 | 9:16]' },
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

    await sendMessage(
      senderId,
      { text: '🎨 Generating image, please wait...' },
      pageAccessToken
    );

    try {
      const apiUrl = 'https://midjanuarybyxnil.onrender.com/imagine';

      const response = await axios.get(apiUrl, {
        params: { prompt, ratio },
        maxRedirects: 5,
        timeout: 30000
      });

      // ✅ URL finale de l’image (après redirection)
      const imageUrl = response.request?.res?.responseUrl;

      if (!imageUrl || !imageUrl.startsWith('http')) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';

      // 🖼️ IMAGE D’ABORD
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

      // 📝 TEXTE APRÈS
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
