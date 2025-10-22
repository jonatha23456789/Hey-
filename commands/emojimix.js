const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "emojimix",
  description: "Mix two emojis together into one image.",
  usage: "-emojimix <emoji1> <emoji2>",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken) {
    if (args.length < 2) {
      return sendMessage(
        senderId,
        {
          text: "⚠️ Please provide two emojis.\nExample: -emojimix 🤔 😶",
        },
        pageAccessToken
      );
    }

    const [emoji1, emoji2] = args;

    const apiUrl = `https://haji-mix-api.gleeze.com/api/emojimix?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.status || !data.url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix image." },
          pageAccessToken
        );
      }

      const mixUrl = data.url;

      // Envoi d’abord du texte d’information
      await sendMessage(
        senderId,
        {
          text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Haji-Mix`,
        },
        pageAccessToken
      );

      // Puis envoi de l’image générée
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              url: mixUrl,
              is_reusable: true,
            },
          },
        },
        pageAccessToken
      );
    } catch (error) {
      console.error("EmojiMix Error:", error.message);
      sendMessage(
        senderId,
        { text: "🚨 An error occurred while generating emoji mix." },
        pageAccessToken
      );
    }
  },
};
