const axios = require('axios');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images using MidJanuary API',
  usage: '-imagine <prompt> [1:1 | 16:9 | 9:16]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event, sendMessageFn, imageCache) {
    if (!args.length) {
      return sendMessageFn(
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

    await sendMessageFn(
      senderId,
      { text: '🎨 Generating image, please wait...' },
      pageAccessToken
    );

    try {
      const apiUrl = 'https://midjanuarybyxnil.onrender.com/imagine';

      // 🔍 Image reply ou cache
      const replyImage = event?.message?.reply_to?.message?.attachments?.[0]?.payload?.url;
      const cachedImg = imageCache?.get(senderId)?.url;
      const imageUrlParam = replyImage || cachedImg || '';

      // ⚠️ API call : renvoie JSON { success: true, result: <url> }
      const { data } = await axios.get(apiUrl, {
        params: { prompt, ratio, imageUrl: imageUrlParam }
      });

      if (!data.success || !data.result) {
        return sendMessageFn(
          senderId,
          { text: '❌ Image generation failed (API returned empty result).' },
          pageAccessToken
        );
      }

      const imageUrl = data.result; // URL finale de l’image
      const deco = '・───── >ᴗ< ─────・';

      // 📝 Envoi texte + image
      await sendMessageFn(
        senderId,
        {
          text:
`${deco}
🎨 | AI Image Generated

🖌 Prompt:
${prompt}

📐 Ratio: ${ratio}
${deco}`,
          attachment: {
            type: 'image',
            payload: { url: imageUrl, is_reusable: true }
          }
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      await sendMessageFn(
        senderId,
        { text: '❌ Error while generating the image.' },
        pageAccessToken
      );
    }
  }
};
