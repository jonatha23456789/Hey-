const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "imagine",
  description: "Generate image from prompt",
  usage: "-imagine <prompt> [1:1 | 16:9 | 9:16]",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {
    try {

      if (!args.length) return;

      // detect ratio
      let ratio = "1:1";
      const lastArg = args[args.length - 1];

      if (["1:1", "16:9", "9:16"].includes(lastArg)) {
        ratio = lastArg;
        args.pop();
      }

      const prompt = args.join(" ");
      if (!prompt) return;

      const api =
        `https://christus-api.vercel.app/image/animagine?prompt=${encodeURIComponent(prompt)}`;

      const { data } = await axios.get(api);

      if (!data.status || !data.image_url) {
        throw new Error("API error");
      }

      const imageUrl = data.image_url;

      // download image
      const img = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      const form = new FormData();

      form.append(
        "recipient",
        JSON.stringify({ id: senderId })
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
    }
  }
};
