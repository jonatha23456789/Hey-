const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const axios = require("axios");

module.exports = {
  config: {
    name: "waifu",
    version: "1.0",
    author: "Hk",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Send random waifu pic" },
    longDescription: { en: "Fetches a random safe (non-R18) waifu image from Lolicon API" },
    category: "fun",
    guide: { en: "Use: waifu" }
  },

  onStart: async function ({ message }) {
    // Envoi du message de chargement
    const loading = await message.reply("🕐 | Chargement de ta waifu mignonne...");

    try {
      // Récupération des données
      const res = await axios.post("https://api.lolicon.app/setu/v2", { r18: 0, num: 1 });
      if (!res.data || !res.data.data || res.data.data.length === 0) {
        return message.reply("❌ | Aucune image trouvée, réessaie !");
      }

      const data = res.data.data[0];
      const imageUrl = data.urls.original || data.urls.regular || data.urls.small;
      const title = data.title || "Inconnue";
      const author = data.author || "Inconnu";
      const ext = data.ext || "jpg";

      // Création du chemin cache
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `waifu_${Date.now()}.${ext}`);

      // Téléchargement de l’image
      const file = fs.createWriteStream(filePath);
      https.get(imageUrl, resImg => {
        resImg.pipe(file);
        file.on("finish", async () => {
          file.close();

          // Supprime le message "chargement"
          if (loading && loading.messageID) {
            message.unsend(loading.messageID);
          }

          // Envoi de la waifu
          const caption = `✨ 𝓦𝓪𝓲𝓯𝓾 ✨\n\n🎨 **Titre:** ${title}\n👤 **Artiste:** ${author}\n\n🌸 Api Credit: Hk`;
          await message.reply({
            body: caption,
            attachment: fs.createReadStream(filePath)
          });

          // Nettoyage du cache
          fs.unlinkSync(filePath);
        });
      }).on("error", err => {
        console.error(err);
        message.reply("❌ | Erreur lors du téléchargement de l'image.");
      });

    } catch (err) {
      console.error(err);
      message.reply("⚠️ | Impossible de se connecter à l'API Lolicon.");
    }
  }
};
