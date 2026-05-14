const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "edit",
  description: "Edit image using AI",
  usage: "-edit <prompt> (reply to image)",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken, event) {
    try {
      let prompt = args.join(" ").trim();

      // 🔥 CHECK IMAGE REPLY
      if (!event?.message?.reply_to?.attachments) {
        return;
      }

      const att = event.message.reply_to.attachments[0];

      if (att.type !== "image") {
        return;
      }

      const imageUrl = att.payload.url;

      if (!prompt) {
        prompt = "make it aesthetic";
      }

      // 🔥 API
      const api =
        `https://azadx69x-all-apis-top.vercel.app/api/editor?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

      // 🔥 GET IMAGE
      const img = await axios.get(api, {
        responseType: "arraybuffer",
        timeout: 60000
      });

      // 🔥 SEND TO FACEBOOK
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
        "edited.jpg"
      );

      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity
        }
      );

    } catch (err) {
      console.error(
        "Edit CMD Error:",
        err.response?.data || err.message
      );
    }
  }
};
