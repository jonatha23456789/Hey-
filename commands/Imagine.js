const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Generate image from prompt",
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
        { text: "🎨 Generating image..." },
        pageAccessToken
      );

      const api =
        `https://christus-api.vercel.app/image/animagine?prompt=${encodeURIComponent(prompt)}`;

      const { data } = await axios.get(api, { timeout: 60000 });

      if (!data || data.status !== true) {
        return sendMessage(
          senderId,
          { text: "❌ Image generation failed." },
          pageAccessToken
        );
      }

      const imageUrl = data.image_url;

      // 🔹 Download image
      const img = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      const buffer = Buffer.from(img.data);

      // 🔹 Send image to messenger
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              is_reusable: true
            }
          },
          filedata: buffer
        },
        pageAccessToken
      );

    } catch (err) {

      console.error(
        "Imagine CMD Error:",
        err.response?.data || err.message
      );

      sendMessage(
        senderId,
        { text: "❌ Error generating image." },
        pageAccessToken
      );
    }
  }
};
