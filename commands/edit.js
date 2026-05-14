const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "edit",
  description: "AI image editor",
  usage: "-edit <prompt> (reply to image)",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken, event) {
    try {

      // 🔥 GET PROMPT
      let prompt = args.join(" ").trim();

      // 🔥 CHECK REPLY
      const replied =
        event?.message?.reply_to?.attachments ||
        event?.messageReply?.attachments;

      if (!replied || replied.length === 0) {
        console.log("No replied image");
        return;
      }

      const attachment = replied[0];

      if (attachment.type !== "image") {
        console.log("Reply is not image");
        return;
      }

      // 🔥 IMAGE URL
      const imageUrl =
        attachment.payload?.url ||
        attachment.url;

      if (!imageUrl) {
        console.log("No image URL");
        return;
      }

      // 🔥 DEFAULT PROMPT
      if (!prompt) {
        prompt = "make it aesthetic";
      }

      // 🔥 API URL
      const api =
        `https://azadx69x-all-apis-top.vercel.app/api/editor?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

      console.log("API:", api);

      // 🔥 SEND LOADING
      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: {
            id: senderId
          },
          message: {
            text: "🎨 Editing image..."
          }
        }
      );

      // 🔥 GET EDITED IMAGE
      const img = await axios.get(api, {
        responseType: "arraybuffer",
        timeout: 120000
      });

      console.log("Image received");

      // 🔥 FORM DATA
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

      // 🔥 SEND IMAGE
      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      console.log("Edited image sent");

    } catch (err) {

      console.error(
        "EDIT CMD ERROR:",
        err.response?.data || err.message
      );

      try {
        await axios.post(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          {
            recipient: {
              id: senderId
            },
            message: {
              text: "❌ Failed to edit image."
            }
          }
        );
      } catch {}
    }
  }
};
