const https = require("https");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "waifu",
  description: "Send random waifu image",
  author: "Hk",
  usage: "waifu",

  async execute(senderId, args, pageAccessToken) {
    try {
      // Message de chargement
      const loadingMsg = await sendMessage(senderId, { text: "🕐 | Chargement de ta waifu mignonne..." }, pageAccessToken);

      // Appel API
      const res = await axios.post("https://api.lolicon.app/setu/v2", { r18: 0, num: 1 });
      if (!res.data?.data?.length) {
        return await sendMessage(senderId, { text: "❌ | Aucune image trouvée !" }, pageAccessToken);
      }

      const imageUrl = res.data.data[0].urls.original;

      // Créer un dossier cache temporaire
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const filePath = path.join(cacheDir, `waifu_${Date.now()}.jpg`);

      // Télécharger l'image
      const file = fs.createWriteStream(filePath);
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on("finish", async () => {
          file.close();

          // Supprimer le message de chargement
          if (loadingMsg?.message_id) {
            await sendMessage(senderId, { message_id: loadingMsg.message_id, text: "" }, pageAccessToken);
          }

          // Envoyer l'image
          await sendMessage(senderId, {
            attachment: { type: "image", payload: { url: `file://${filePath}` } }
          }, pageAccessToken);

          // Envoyer le texte
          await sendMessage(senderId, {
            text: "✨ 𝓒𝓾𝓽𝓮 𝓦𝓪𝓲𝓯𝓾 ✨\n\n🌸 Api Credit: Hk"
          }, pageAccessToken);

          // Optionnel : supprimer l'image après envoi
          fs.unlink(filePath, () => {});
        });
      }).on("error", async (err) => {
        console.error(err);
        await sendMessage(senderId, { text: "❌ | Erreur lors du téléchargement de l'image." }, pageAccessToken);
      });

    } catch (err) {
      console.error(err);
      await sendMessage(senderId, { text: "❌ | Impossible de récupérer une image depuis l'API." }, pageAccessToken);
    }
  }
};
