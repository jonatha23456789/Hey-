const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using MidJanuary API',
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

    // 🔹 Extraire le ratio si spécifié
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
        { text: '⚠️ Veuillez fournir un prompt valide.' },
        pageAccessToken
      );
    }

    await sendMessage(
      senderId,
      { text: '🎨 Generating image, please wait...' },
      pageAccessToken
    );

    try {
      const apiUrl = 'https://midjanuarybyxnil.onrender.com/imagine';
      const { data } = await axios.get(apiUrl, { params: { prompt, ratio } });

      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Image generation failed (API returned empty result).' },
          pageAccessToken
        );
      }

      const imageUrl = data.result; // ✅ l’URL de l’image générée
      const deco = '・───── >ᴗ< ─────・';

      // 📝 Envoyer d’abord le texte de confirmation
      await sendMessage(
        senderId,
        {
          text:
`${deco}
🎨 | AI Image Generated

🖌 Prompt: ${prompt}
📐 Ratio: ${ratio}
${deco}`
        },
        pageAccessToken
      );

      // 🖼️ Envoyer ensuite l’image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: imageUrl, is_reusable: true }
          }
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating the image. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
