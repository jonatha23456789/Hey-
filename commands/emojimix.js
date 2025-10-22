const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'emojimix',
  description: 'Mix two emojis together into one image.',
  usage: '-emojimix <emoji1> <emoji2>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (args.length < 2) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide two emojis.\nExample: -emojimix 🤔 😶' },
        pageAccessToken
      );
    }

    const [emoji1, emoji2] = args;

    // Première API (Delirius)
    const mainAPI = `https://delirius-apiofc.vercel.app/tools/mixed?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    // API de secours (emojik)
    const backupAPI = `https://emojik.vercel.app/api/mix?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    let imageUrl = null;
    let source = '';

    try {
      // 🔹 Tentative avec l'API principale
      const { data } = await axios.get(mainAPI);
      imageUrl = data?.data?.url || data?.url || null;
      source = 'Delirius';
    } catch (err) {
      console.warn('⚠️ Main API failed, trying backup...');
    }

    // 🔸 Si l'API principale échoue ou ne renvoie rien, on passe à la backup
    if (!imageUrl) {
      try {
        const { data } = await axios.get(backupAPI);
        imageUrl = data?.url || data?.image || null;
        source = 'EmojiK';
      } catch (err) {
        console.error('🚨 Backup API also failed:', err.message);
      }
    }

    // ❌ Si aucune image n’a été trouvée
    if (!imageUrl) {
      return sendMessage(
        senderId,
        {
          text: `❌ Failed to mix these emojis.\nPlease try different emojis or try again later.`,
        },
        pageAccessToken
      );
    }

    // ✅ Envoi du message et de l’image
    await sendMessage(
      senderId,
      {
        text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: ${source}`,
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
            is_reusable: true,
          },
        },
      },
      pageAccessToken
    );
  },
};
