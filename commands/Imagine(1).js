const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "imagine",
  description: "Generate image from prompt",
  usage: "-imagine <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {
    try {
      const prompt = args.join(" ");
      if (!prompt) return;

      // 🔥 NEW API
      const api = `https://smfahim.xyz/ai/mj/v1?prompt=${encodeURIComponent(prompt)}`;

      const { data } = await axios.get(api, { timeout: 30000 });

      if (!data?.success || !data?.imageUrl) {
        throw new Error("API failed");
      }

      const imageUrl = data.imageUrl;

      // 🔹 download image
      const img = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      const form = new FormData();

      form.append(
        "recipient",
        JSON.stringify({
          id: senderId
        })
      );

      form.append(
        "message",
        JSON.stringify({
          attachment: {
            type: "image",
            payload: {}
          }
        })
      );

      form.append("filedata", Buffer.from(img.data), "ai.webp");

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
    }
  }
};
