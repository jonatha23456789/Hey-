const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "emojimix",
  description: "Mix two emojis into one.",
  usage: "-emojimix 🤔 😶",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken) {
    if (args.length < 2) {
      return sendMessage(
        senderId,
        { text: "⚠️ Please provide two emojis.\nExample: -emojimix 😍 🤯" },
        pageAccessToken
      );
    }

    const [emoji1, emoji2] = args;
    const apiUrl = `https://delirius-apiofc.vercel.app/tools/mixed?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data || !data.status || !data.data?.url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix. Please try again later." },
          pageAccessToken
        );
      }

      const imageUrl = data.data.url;

      // 🔹 Envoi du texte explicatif d’abord
      await sendMessage(
        senderId,
        {
          text: `✨ *Emoji Mix Created!*\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Delirius`,
        },
        pageAccessToken
      );

      // 🔹 Envoi ensuite de l’image mixée
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              url: imageUrl,
              is_reusable: true,
            },
          },
        },
        pageAccessToken
      );
    } catch (error) {
      console.error("EmojiMix Command Error:", error.message);
      await sendMessage(
        senderId,
        { text: "🚨 An error occurred while generating the emoji mix." },
        pageAccessToken
      );
    }
  },
};
