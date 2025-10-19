const https = require("https");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Create a beautiful anime image from prompt",
  author: "Hk",
  usage: "imagine <prompt>",

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: "❌ | Please provide a prompt. Example: imagine Anime" }, pageAccessToken);
    }

    const prompt = args.join(" ");
    try {
      // Message de chargement
      const loadingMsg = await sendMessage(senderId, { text: "🎨 | Generating your anime image, please wait..." }, pageAccessToken);

      // Appel API
      const apiUrl = `https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl);

      if (res.data.status !== "success" || !res.data.url) {
        return sendMessage(senderId, { text: "❌ | Unable to generate image, try again later!" }, pageAccessToken);
      }

      const imageUrl = res.data.url;

      // Créer dossier cache
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const filePath = path.join(cacheDir, `imagine_${Date.now()}.png`);

      // Télécharger l'image
      const file = fs.createWriteStream(filePath);
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on("finish", async () => {
          file.close();

          // Supprimer message de chargement
          if (loadingMsg?.message_id) {
            await sendMessage(senderId, { message_id: loadingMsg.message_id, text: "" }, pageAccessToken);
          }

          // Envoyer l'image
          await sendMessage(senderId, {
            attachment: { type: "image", payload: { url: `file://${filePath}` } }
          }, pageAccessToken);

          // Envoyer le texte "beautiful prompt"
          await sendMessage(senderId, {
            text: `✨ Your beautiful anime image based on prompt:\n🎴 Prompt: ${prompt}\n🌟 Api Credit: Hk`
          }, pageAccessToken);

          // Supprimer l'image locale
          fs.unlink(filePath, () => {});
        });
      }).on("error", async (err) => {
        console.error(err);
        await sendMessage(senderId, { text: "❌ | Error while downloading the image." }, pageAccessToken);
      });

    } catch (err) {
      console.error(err);
      await sendMessage(senderId, { text: "❌ | Failed to generate image from API." }, pageAccessToken);
    }
  }
};
