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

      if (!data || !data.status || !data.data?.url) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to mix emojis. Please try again later.' },
          pageAccessToken
        );
      }

      // Message texte avant l’image
      await sendMessage(
        senderId,
        { text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪` },
        pageAccessToken
      );

      // Envoi de l’image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: data.data.url, is_reusable: true }
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
