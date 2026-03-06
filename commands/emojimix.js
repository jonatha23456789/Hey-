const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "emojimix",
  description: "Mix two emojis into one.",
  usage: "-emojimix 😍 🤯",
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

    try {
      const apiUrl = `https://azadx69x-all-apis-top.vercel.app/api/emojimix?e1=${encodeURIComponent(
        emoji1
      )}&e2=${encodeURIComponent(emoji2)}`;

      const response = await axios.get(apiUrl, { timeout: 30000 });
      const data = response.data;

      if (!data || !data.success || !data.result || !data.result.image_url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix image. Make sure your emojis are valid." },
          pageAccessToken
        );
      }

      const imageUrl = data.result.image_url;

      // 🔹 Envoi direct du lien sans télécharger localement
      await sendMessage(
        senderId,
        {
          text: `✨ Emoji Mix Created!\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Azadx69x`,
        },
        pageAccessToken
      );

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
    } catch (err) {
      console.error("EmojiMix Command Error:", err.message || err);
      await sendMessage(
        senderId,
        { text: "🚨 An error occurred while generating emoji mix." },
        pageAccessToken
      );
    }
  },
};
