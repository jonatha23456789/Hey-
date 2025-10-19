const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { sendMessage } = require("../handles/sendMessage");

const token = fs.readFileSync("token.txt", "utf8");

module.exports = {
  name: "waifu",
  description: "Send a cute random waifu image",
  author: "Hk",
  usage: "waifu",

  async execute(senderId, args) {
    const pageAccessToken = token;
    const loadingMsg = await sendMessage(senderId, { text: "🕐 | Chargement de ta waifu mignonne..." }, pageAccessToken);

    try {
      const res = await axios.post("https://api.lolicon.app/setu/v2", {
        r18: 0,
        num: 1
      });

      if (!res.data || !res.data.data || res.data.data.length === 0) {
        return await sendMessage(senderId, { text: "❌ | Aucune image trouvée, réessaie !" }, pageAccessToken);
      }

      const imageUrl =
        res.data.data[0].urls.original ||
        res.data.data[0].urls.regular ||
        res.data.data[0].urls.small;

      // Téléchargement temporaire de l'image
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const filePath = path.join(cacheDir, `waifu_${Date.now()}.jpg`);

      const file = fs.createWriteStream(filePath);
      https.get(imageUrl, resImg => {
        resImg.pipe(file);
        file.on("finish", async () => {
          file.close();

          // Supprimer le message de chargement
          if (loadingMsg?.message_id) {
            await sendMessage(senderId, { message_id: loadingMsg.message_id, text: "" }, pageAccessToken);
          }

          const caption = `
✨ 𝓒𝓾𝓽𝓮 𝓦𝓪𝓲𝓯𝓾 ✨

🌸 Api Credit: Hk
          `.trim();

          await sendMessage(senderId, {
            attachment: {
              type: "image",
              payload: {
                url: imageUrl,
                is_reusable: true
              }
            }
          }, pageAccessToken);

          await sendMessage(senderId, { text: caption }, pageAccessToken);

          // Supprime le fichier temporaire après envoi
          fs.unlinkSync(filePath);
        });
      }).on("error", async err => {
        console.error(err);
        await sendMessage(senderId, { text: "❌ | Erreur lors du téléchargement de l'image." }, pageAccessToken);
      });

    } catch (err) {
      console.error(err);
      await sendMessage(senderId, { text: "❌ | Impossible de récupérer une image depuis l'API." }, pageAccessToken);
    }
  }
};
