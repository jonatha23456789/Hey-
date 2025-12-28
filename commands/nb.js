const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 📸 Récupérer l'image depuis un reply (Graph API)
async function getReplyImage(event, pageAccessToken) {
  const mid = event?.message?.reply_to?.mid;
  if (!mid) return null;

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/${mid}/attachments`,
      { params: { access_token: pageAccessToken } }
    );

    return (
      data?.data?.[0]?.image_data?.url ||
      data?.data?.[0]?.file_url ||
      null
    );
  } catch (err) {
    console.error('Reply image fetch error:', err.message);
    return null;
  }
}

module.exports = {
  name: 'nb',
  description: 'Generate Nano-Banana AI images using a replied image',
  usage: '-nb <prompt> (reply to an image)',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-nanobanana <prompt>\n(Reply to an image)' },
        pageAccessToken
      );
    }

    // 📝 Prompt
    const prompt = args.join(' ').trim();

    // 📸 Image depuis reply
    const imageUrl = await getReplyImage(event, pageAccessToken);

    if (!imageUrl) {
      return sendMessage(
        senderId,
        { text: '❌ Please reply to an image before using Nano-Banana.' },
        pageAccessToken
      );
    }

    // ⏳ Feedback utilisateur
    await sendMessage(
      senderId,
      { text: '🍌 Generating Nano-Banana image, please wait (20–40s)...' },
      pageAccessToken
    );

    try {
      const { data } = await axios.get(
        'https://api.nekolabs.web.id/img.gen/nano-banana',
        {
          params: { prompt, imageUrl },
          timeout: 120000
        }
      );

      if (!data?.success || !data?.result) {
        console.error('NanoBanana API error:', data);
        return sendMessage(
          senderId,
          { text: '❌ Nano-Banana generation failed. Try again later.' },
          pageAccessToken
        );
      }

      const imageResult = data.result;
      const deco = '・───── 🍌 ─────・';

      // 📝 Message texte
      await sendMessage(
        senderId,
        {
          text:
`${deco}
🍌 | Nano-Banana Generated

🖌 Prompt:
${prompt}

${deco}`
        },
        pageAccessToken
      );

      // 🖼️ Image finale
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: imageResult,
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
        { text: '❌ Nano-Banana API timeout or error. Please retry.' },
        pageAccessToken
      );
    }
  }
};
