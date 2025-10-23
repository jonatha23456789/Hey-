const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "emojimix",
  description: "Mix two emojis into one.",
  usage: "-emojimix 🤔 😶",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken) {
    if (args.length < 2) {
      return sendMessage(
        senderId,
        { text: "⚠️ Please provide two emojis.\nExample: -emojimix 😍 🤯" },
        pageAccessToken
      );
    }

    const [emoji1, emoji2] = args;
    const apiUrl = `https://delirius-apiofc.vercel.app/tools/mixed?emoji1=${encodeURIComponent(
      emoji1
    )}&emoji2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data?.status || !data?.data?.url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix image." },
          pageAccessToken
        );
      }

      const imageUrl = data.data.url;

      // 🔹 Téléchargement de l’image localement
      const imgPath = path.join(__dirname, `emojimix_${Date.now()}.png`);
      const imgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgResponse.data);

      // 🔹 Upload vers Facebook
      const form = new FormData();
      form.append(
        "message",
        JSON.stringify({
          attachment: { type: "image", payload: { is_reusable: true } },
        })
      );
      form.append("filedata", fs.createReadStream(imgPath));

      const upload = await axios.post(
        `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

      const attachmentId = upload.data.attachment_id;

      // 🔹 Envoi du texte d’abord
      await sendMessage(
        senderId,
        {
          text: `✨ *Emoji Mix Created!*\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Delirius`,
        },
        pageAccessToken
      );

      // 🔹 Envoi de l’image mixée ensuite
      await axios.post(
        `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: { attachment: { type: "image", payload: { attachment_id: attachmentId } } },
        }
      );

      fs.unlinkSync(imgPath); // 🧹 Nettoyage du fichier temporaire
    } catch (err) {
      console.error("EmojiMix Command Error:", err.message || err);
      await sendMessage(
        senderId,
        { text: "🚨 An error occurred while generating emoji mix." },
        pageAccessToken
      );
    }
  },
};
