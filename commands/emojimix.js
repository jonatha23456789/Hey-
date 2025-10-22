const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "emojimix",
  description: "Mix two emojis into a single image.",
  usage: "-emojimix 🤔 😶",
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

    const apiUrl = `https://delirius-apiofc.vercel.app/tools/mixed?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.status || !data.data || !data.data.url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix image." },
          pageAccessToken
        );
      }

      const mixUrl = data.data.url;

      // 🔹 Envoi d’un texte explicatif avant l’image
      await sendMessage(
        senderId,
        {
          text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Delirius`,
        },
        pageAccessToken
      );

      // 🔹 Envoi de l’image
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
      console.error("EmojiMix Error:", error.message || error);
      sendMessage(
        senderId,
        { text: "🚨 Failed to connect to the emoji mix API." },
        pageAccessToken
      );
    }
  },
};
