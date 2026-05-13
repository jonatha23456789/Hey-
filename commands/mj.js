const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "mj",
  description: "Generate Midjourney style images",
  usage: "-mj <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {
    try {
      const prompt = args.join(" ").trim();

      if (!prompt) return;

      // ⏳ loading message
      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            text: `🎨 Generating images...\n🧠 Prompt: ${prompt}`
          }
        }
      );

      // 🔥 NEW API
      const api = `https://azadx69x-all-apis-top.vercel.app/api/mj?prompt=${encodeURIComponent(prompt)}`;

      const { data } = await axios.get(api, {
        timeout: 60000
      });

      // 🔥 validation
      if (
        !data?.success ||
        !data?.data?.images ||
        !Array.isArray(data.data.images)
      ) {
        throw new Error("API failed");
      }

      const images = data.data.images.slice(0, 4);

      // 🔥 send all images
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];

        // download image
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

        form.append(
          "filedata",
          Buffer.from(img.data),
          `mj_${i + 1}.png`
        );

        // send image
        await axios.post(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          form,
          {
            headers: form.getHeaders()
          }
        );
      }

    } catch (err) {
      console.error(
        "MJ CMD Error:",
        err.response?.data || err.message
      );

      // ❌ error message
      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            text: "🚨 Error generating images."
          }
        }
      );
    }
  }
};
