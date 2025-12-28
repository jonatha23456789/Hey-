const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using Nekolabs Imagen 4.0-fast',
  usage: '-imagine <prompt> [1:1 | 16:9 | 9:16]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-imagine <prompt> [1:1 | 16:9 | 9:16]' },
        pageAccessToken
      );
    }

    // 🔹 Détecter le ratio (dernier argument)
    let ratio = '1:1';
    const lastArg = args[args.length - 1];
    if (['1:1', '16:9', '9:16'].includes(lastArg)) {
      ratio = lastArg;
      args.pop();
    }

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a valid prompt.' },
        pageAccessToken
      );
    }

    await sendMessage(
      senderId,
      { text: '🎨 Generating image, please wait...' },
      pageAccessToken
    );

    try {
      const apiUrl = 'https://api.nekolabs.web.id/img.gen/imagen/4.0-fast';

      const { data } = await axios.get(apiUrl, {
        params: {
          prompt: prompt,
          ratio: ratio
        }
      });

      // ✅ Vérification stricte
      if (!data || data.success !== true || !data.result) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed (invalid API response).' },
          pageAccessToken
        );
      }

      const imageUrl = data.result;
      const deco = '・───── >ᴗ< ─────・';

      // 📝 Texte
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

      // 🖼️ Image
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
      console.error('Imagine Command Error:', error.response?.data || error.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating the image. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
