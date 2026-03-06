const axios = require("axios");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Generate image from prompt",
  usage: "-imagine <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {
    try {

      const prompt = args.join(" ");
      if (!prompt) {
        return sendMessage(
          senderId,
          { text: "⚠️ Usage: -imagine <prompt>" },
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

      const { data } = await axios.get(api);

      if (!data.status || !data.image_url) {
        throw new Error("API failed");
      }

      const imageUrl = data.image_url;

      // 📥 Download image
      const img = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      const form = new FormData();

      form.append(
        "message",
        JSON.stringify({
          attachment: {
            type: "image",
            payload: {}
          }
        })
      );

      form.append("filedata", Buffer.from(img.data), "ai.png");

      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
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
