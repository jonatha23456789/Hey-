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

    // API principale
    const mainAPI = `https://delirius-apiofc.vercel.app/tools/mixed?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    // API de secours
    const backupAPI = `https://emojik.vercel.app/api/mix?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    let imageUrl = null;
    let source = 'Delirius';

    try {
      const { data } = await axios.get(mainAPI);
      // On vérifie plus en profondeur si une URL existe
      imageUrl =
        data?.data?.url ||
        data?.result?.url ||
        data?.url ||
        data?.data ||
        null;
    } catch (error) {
      console.warn('⚠️ Delirius API failed:', error.message);
    }

    // Si aucune image trouvée via Delirius, passer à l’API backup
    if (!imageUrl) {
      try {
        const { data } = await axios.get(backupAPI);
        imageUrl = data?.url || data?.image || null;
        source = 'EmojiK';
      } catch (error) {
        console.error('🚨 Backup API failed:', error.message);
      }
    }

    // Toujours envoyer un message avant l’image
    await sendMessage(
      senderId,
      {
        text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: ${source}`,
      },
      pageAccessToken
    );

    // Si on a une image, on l’envoie
    if (imageUrl) {
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
    } else {
      await sendMessage(
        senderId,
        { text: '❌ Could not fetch image from both APIs.' },
        pageAccessToken
      );
    }
  },
};
