const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'emojimix',
  description: 'Mix two emojis together.',
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
    const apiUrl = `https://delirius-apiofc.vercel.app/tools/mixed?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      // Debug : affichage des données reçues (utile si tu veux vérifier dans la console)
      console.log('EmojiMix API Response:', data);

      const imageUrl =
        data?.data?.url ||
        data?.result?.url ||
        data?.url ||
        null;

      if (!imageUrl) {
        return sendMessage(
          senderId,
          {
            text: `❌ No valid image found.\n\n🧩 API response:\n${JSON.stringify(data, null, 2)}`
          },
          pageAccessToken
        );
      }

      // Message texte avant l'image
      await sendMessage(
        senderId,
        { text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪` },
        pageAccessToken
      );

      // Envoi de l'image
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
      console.error('EmojiMix Command Error:', error.message || error);
      return sendMessage(
        senderId,
        { text: '🚨 An error occurred while mixing emojis.' },
        pageAccessToken
      );
    }
  }
};
