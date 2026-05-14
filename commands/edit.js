const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  name: "edit",
  description: "AI image editor",
  usage: "-edit <prompt> (reply to image)",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken, event) {
    try {

      let prompt = args.join(" ").trim();

      // 🔥 DEBUG EVENT
      console.log(JSON.stringify(event, null, 2));

      // 🔥 GET REPLIED MESSAGE
      let repliedMessage =
        event?.message?.reply_to ||
        event?.messageReply ||
        event?.reply_to_message;

      // 🔥 GET ATTACHMENTS
      let attachments =
        repliedMessage?.attachments ||
        repliedMessage?.message?.attachments ||
        [];

      if (!attachments.length) {
        console.log("No replied image");
        return;
      }

      // 🔥 FIND IMAGE
      const imageAttachment = attachments.find(
        att => att.type === "image"
      );

      if (!imageAttachment) {
        console.log("Reply is not image");
        return;
      }

      // 🔥 GET IMAGE URL
      const imageUrl =
        imageAttachment.payload?.url ||
        imageAttachment.url;

      if (!imageUrl) {
        console.log("No image URL");
        return;
      }

      // 🔥 DEFAULT PROMPT
      if (!prompt) {
        prompt = "make it aesthetic";
      }

      // 🔥 API
      const api =
        `https://azadx69x-all-apis-top.vercel.app/api/editor?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

      console.log("API:", api);

      // 🔥 LOADING MESSAGE
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

      // 🔥 DOWNLOAD EDITED IMAGE
      const img = await axios.get(api, {
        responseType: "arraybuffer",
        timeout: 120000
      });

      console.log("Edited image received");

      // 🔥 SEND IMAGE
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
