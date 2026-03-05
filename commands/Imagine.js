const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "GENERATE IMAGE FROM PROMPT",
  usage: "imagine <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {
    try {
      const prompt = args.join(" ").trim();

      if (!prompt) {
        return sendMessage(
          senderId,
          { text: "⚠️ Usage: imagine <prompt>" },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        { text: "🎨 Generating image, please wait..." },
        pageAccessToken
      );

      const encodedPrompt = encodeURIComponent(prompt);

      const apiUrl =
        `https://christus-api.vercel.app/image/animagine?prompt=${encodedPrompt}`;

      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data || !data.status || !data.image_url) {
        return sendMessage(
          senderId,
          { text: "❌ API failed to generate image." },
          pageAccessToken
        );
      }

      const imageUrl = data.image_url;

      // Télécharger l'image pour éviter blocage Meta
      const img = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000
      });

      const buffer = Buffer.from(img.data);

      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: { is_reusable: true }
          },
          filedata: buffer
        },
        pageAccessToken
      );

    } catch (error) {
      console.error("Imagine CMD Error:", error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: "❌ Error generating image." },
        pageAccessToken
      );
    }
  }
};
