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
          { text: "⚠️ | Please provide a prompt.\nExample: imagine anime girl with blue hair" },
          pageAccessToken
        );
      }

      const apiUrl = `https://christus-api.vercel.app/image/animagine?prompt=${encodeURIComponent(prompt)}`;

      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data.status) {
        return sendMessage(
          senderId,
          { text: "❌ | Failed to generate image." },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              url: data.image_url,
              is_reusable: true
            }
          }
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
