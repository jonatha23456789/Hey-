const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "edit",
  description: "Edit replied image with AI",
  usage: "-edit <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken, event) {
    try {
      const prompt = args.join(" ").trim();

      if (!prompt) {
        return;
      }

      // 🔹 vérifier reply
      const replyMid = event?.message?.reply_to?.mid;

      if (!replyMid) {
        console.log("No reply detected");
        return;
      }

      // 🔥 GET ORIGINAL MESSAGE
      const msgApi =
        `https://graph.facebook.com/v19.0/${replyMid}?fields=attachments&access_token=${pageAccessToken}`;

      const msgRes = await axios.get(msgApi);

      const attachments = msgRes.data.attachments?.data;

      if (!attachments || attachments.length === 0) {
        console.log("No attachment found");
        return;
      }

      const imageUrl = attachments[0]?.image_data?.url;

      if (!imageUrl) {
        console.log("No image URL");
        return;
      }

      console.log("IMAGE URL:", imageUrl);

      // 🔥 EDIT API
      const api =
        `https://azadx69x-all-apis-top.vercel.app/api/editor?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

      // 🔥 GET IMAGE AS BUFFER
      const img = await axios.get(api, {
        responseType: "arraybuffer",
        timeout: 60000
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
        "edited.png"
      );

      // 🔥 SEND IMAGE
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
        "EDIT CMD ERROR:",
        err.response?.data || err.message
      );
    }
  }
};
