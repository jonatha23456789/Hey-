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

      // Vérifie si l’API renvoie bien une URL valide
      if (!data || !data.status || !data.data || !data.data.url) {
        console.log("Invalid API response:", data);
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix image. API returned no image." },
          pageAccessToken
        );
      }

      const imageUrl = data.data.url;

      // Vérifie que l’image existe bien avant l’envoi
      const check = await axios.head(imageUrl);
      if (!check.headers["content-type"].startsWith("image")) {
        return sendMessage(
          senderId,
          { text: "❌ The API did not return a valid image file." },
          pageAccessToken
        );
      }

      // Envoi du texte d’abord
      await sendMessage(
        senderId,
        {
          text: `✨ Emoji Mix Created!\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Delirius`,
        },
        pageAccessToken
      );

      // Envoi de l’image ensuite
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
      console.error("EmojiMix Command Error:", error.message || error);
      return sendMessage(
        senderId,
        { text: "🚨 An error occurred while generating the emoji mix image." },
        pageAccessToken
      );
    }
  },
};
