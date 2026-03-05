const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "GENERATE IMAGE FROM PROMPT",
  usage: "imagine [prompt]",
  author: "Coffee",

  async execute(senderId, args, pageAccessToken) {
    try {
      const prompt = args.join(" ");

      if (!prompt) {
        return sendMessage(
          senderId,
          { text: "⚠️ | Please provide a prompt." },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        { text: "🎨 Generating image..." },
        pageAccessToken
      );

      const apiUrl = `https://christus-api.vercel.app/image/animagine?prompt=${encodeURIComponent(prompt)}`;

      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.image_url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate image." },
          pageAccessToken
        );
      }

      // 🔹 Download image as buffer
      const img = await axios.get(data.image_url, {
        responseType: "arraybuffer"
      });

      const buffer = Buffer.from(img.data, "binary");

      // 🔹 Send image
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

    } catch (error) {
      console.error("Imagine CMD Error:", error.message);
      sendMessage(
        senderId,
        { text: "❌ Error generating image." },
        pageAccessToken
      );
    }
  }
};
