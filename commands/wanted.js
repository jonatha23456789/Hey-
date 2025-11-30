const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "wanted",
  description: "Generate a Wanted poster of a user",
  usage: "-wanted [tag|reply|none]",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken, event) {
    try {
      // 1️⃣ Trouver l’ID cible
      let targetId = senderId;

      // si reply
      if (event && event.messageReply) {
        targetId = event.messageReply.senderID;
      }

      // si mention
      if (event && event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = Object.keys(event.mentions)[0];
      }

      // 2️⃣ Récup PP Facebook (512px)
      const avatar = `https://graph.facebook.com/${targetId}/picture?width=512&height=512`;

      // 3️⃣ API Wanted (style DIG)
      const apiURL = `https://some-random-api.com/canvas/wanted?avatar=${encodeURIComponent(avatar)}`;

      // 4️⃣ Télécharger image finale
      const img = await axios.get(apiURL, { responseType: "arraybuffer" });

      const filePath = path.join(__dirname, "wanted.png");
      fs.writeFileSync(filePath, img.data);

      // 5️⃣ Envoyer à Facebook
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              is_reusable: true
            }
          }
        },
        pageAccessToken,
        filePath
      );

      // Supprimer fichier après upload
      fs.unlinkSync(filePath);

    } catch (error) {
      console.log("WANTED ERROR:", error.message);
      await sendMessage(
        senderId,
        { text: "❌ Impossible de générer le poster WANTED." },
        pageAccessToken
      );
    }
  }
};
