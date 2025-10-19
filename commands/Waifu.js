const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "waifu",
  description: "Send random waifu image",
  author: "Hk",
  usage: "waifu",

  async execute(senderId, args, pageAccessToken) {
    try {
      // Envoi message de chargement
      const loadingMsg = await sendMessage(senderId, { text: "🕐 | Chargement de ta waifu mignonne..." }, pageAccessToken);

      // Récupération de l'image depuis l'API
      const res = await axios.post("https://api.lolicon.app/setu/v2", { r18: 0, num: 1 });
      if (!res.data?.data?.length) {
        return await sendMessage(senderId, { text: "❌ | Aucune image trouvée !" }, pageAccessToken);
      }

      const imageUrl = res.data.data[0].urls.original;

      // Création dossier cache
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `waifu_${Date.now()}.jpg`);

      // Téléchargement de l'image
      const file = fs.createWriteStream(filePath);
      https.get(imageUrl, resImg => {
        resImg.pipe(file);
        file.on("finish", async () => {
          file.close();

          // Supprimer le message de chargement si supporté
          if (loadingMsg?.message_id) {
            await sendMessage(senderId, { message_id: loadingMsg.message_id, text: "" }, pageAccessToken);
          }

          // Envoi de l'image
          await sendMessage(senderId, {
            attachment: fs.createReadStream(filePath)
          }, pageAccessToken);

          // Envoi du texte après
          await sendMessage(senderId, { text: "✨ 𝓒𝓾𝓽𝓮 𝓦𝓪𝓲𝓯𝓾 ✨\n\n🌸 Api Credit: Hk" }, pageAccessToken);

          // Supprimer le fichier local après envoi
          fs.unlinkSync(filePath);
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
