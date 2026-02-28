const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using Christus API (xl + animagine)',
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

    // 🔹 Encodage du prompt pour l'URL
    const encodedPrompt = encodeURIComponent(prompt);

    // 🔹 API endpoints
    const apis = [
      `https://christus-api.vercel.app/image/xl?prompt=${encodedPrompt}`,
      `https://christus-api.vercel.app/image/animagine?prompt=${encodedPrompt}`
    ];

    let imageUrl = null;
    let usedApi = null;

    try {
      // 🔹 Essayer la première API
      for (const apiUrl of apis) {
        try {
          const { data } = await axios.get(apiUrl, { timeout: 60000 });
          if (data?.status && data?.image_url) {
            imageUrl = data.image_url;
            usedApi = apiUrl.includes('xl') ? 'XL' : 'Animagine';
            break;
          }
        } catch (err) {
          console.warn(`API failed: ${apiUrl} - ${err.message}`);
          continue; // passer à la prochaine API
        }
      }

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image from both APIs.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';

      // 📝 Message texte
      await sendMessage(
        senderId,
        {
          text:
`${deco}
🎨 | AI Image Generated

🖌 Prompt:
${prompt}

📐 Ratio: ${ratio}
📡 Source: ${usedApi}
${deco}`
        },
        pageAccessToken
      );

      // 🖼️ Envoi de l’image
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
      console.error('Imagine Command Error:', error.response?.data || error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating the image. Please try again later.' },
        pageAccessToken
      );
    }
  }
};
