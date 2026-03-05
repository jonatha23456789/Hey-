const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Generate AI image",
  usage: "-imagine <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {

    if (!args.length) {
      return sendMessage(
        senderId,
        { text: "⚠️ Usage: -imagine <prompt>" },
        pageAccessToken
      );
    }

    const prompt = args.join(" ");
    const api = `https://christus-api.vercel.app/image/animagine?prompt=${encodeURIComponent(prompt)}`;

    try {

      await sendMessage(
        senderId,
        { text: "🎨 Generating your AI image...\n⏳ Please wait..." },
        pageAccessToken
      );

      const res = await axios.get(api);

      // détecte plusieurs types de réponses API
      const imageUrl =
        res.data?.image_url ||
        res.data?.url ||
        res.data?.image ||
        res.data?.data;

      if (!imageUrl) {
        console.log("API RESPONSE:", res.data);
        return sendMessage(
          senderId,
          { text: "❌ API did not return an image." },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (error) {
      console.error("AI IMAGE ERROR:", error.response?.data || error.message);

      sendMessage(
        senderId,
        { text: "❌ Failed to generate image. API may be offline." },
        pageAccessToken
      );
    }
  }
};
