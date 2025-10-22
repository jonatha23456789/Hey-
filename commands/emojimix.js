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

    const apiUrl = `https://emojik.vercel.app/api/mix?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      // Vérifie si on a bien une image valide
      const imageUrl =
        data?.url ||
        data?.image ||
        data?.result ||
        (typeof data === 'string' && data.includes('http') ? data : null);

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate emoji mix image.' },
          pageAccessToken
        );
      }

      // Envoie d’abord la description
      await sendMessage(
        senderId,
        {
          text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: EmojiK`,
        },
        pageAccessToken
      );

      // Puis l’image générée
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
    } catch (error) {
      console.error('EmojiMix Error:', error.message);
      sendMessage(
        senderId,
        { text: '🚨 An error occurred while mixing emojis.' },
        pageAccessToken
      );
    }
  },
};
