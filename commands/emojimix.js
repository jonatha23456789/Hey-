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
    const apiUrl = `https://azadx69x-all-apis-top.vercel.app/api/emojimix?e1=${encodeURIComponent(
      emoji1
    )}&e2=${encodeURIComponent(emoji2)}`;

    try {
      const { data } = await axios.get(apiUrl);

      // ✅ Vérification stricte de l'API
      if (!data?.success || !data?.result?.image_url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate emoji mix image." },
          pageAccessToken
        );
      }

      const imageUrl = data.result.image_url;

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
          text: `✨ *Emoji Mix Created!*\n\n${emoji1} + ${emoji2} = 🧪\n📡 Source: Azadx69x`,
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
