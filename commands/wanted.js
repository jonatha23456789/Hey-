const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "wanted",
  description: "Create a One Piece Wanted poster of a user.",
  usage: "-wanted [tag|reply|none]",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken, event) {
    try {

      // 1️⃣ Identification de l'utilisateur ciblé
      let targetId = senderId;

      if (event?.messageReply?.senderID) {
        targetId = event.messageReply.senderID;
      }

      if (event?.mentions && Object.keys(event.mentions).length > 0) {
        targetId = Object.keys(event.mentions)[0];
      }

      // 2️⃣ URL avatar FB
      const avatarUrl = `https://graph.facebook.com/${targetId}/picture?width=512&height=512`;

      // 3️⃣ API Wanted
      const apiUrl = `https://api.nekolabs.web.id/canvas/wanted?image=${encodeURIComponent(avatarUrl)}`;

      const img = await axios.get(apiUrl, { responseType: "arraybuffer" });

      // 4️⃣ Sauvegarde temporaire
      const filePath = path.join(__dirname, "wanted.png");
      fs.writeFileSync(filePath, img.data);

      // 5️⃣ UPLOAD VERS FACEBOOK pour obtenir un attachment_id
      const formData = new FormData();
      formData.append("message", JSON.stringify({
        attachment: { type: "image", payload: { is_reusable: true } }
      }));
      formData.append("filedata", fs.createReadStream(filePath));

      const uploadRes = await axios.post(
        `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        formData,
        { headers: formData.getHeaders() }
      );

      const attachmentId = uploadRes.data.attachment_id;

      // 6️⃣ Envoi au chat
      await axios.post(
        `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: "image",
              payload: { attachment_id: attachmentId }
            }
          }
        }
      );

      fs.unlinkSync(filePath);

    } catch (err) {
      console.log("Wanted error:", err.response?.data || err.message);

      sendMessage(
        senderId,
        { text: "❌ Impossible de générer le poster WANTED." },
        pageAccessToken
      );
    }
  }
};
