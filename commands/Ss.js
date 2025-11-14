const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "ss",
  description: "Take screenshots of webpages (FULL Facebook compatible)",
  usage: "-ss <url>",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: "⚠️ Provide a URL.\nExample: -ss https://youtube.com" },
        pageAccessToken
      );
    }

    for (const url of args) {
      try {
        // URL du screenshot (API STABLE)
        const screenshotUrl = `https://shot.screenshotapi.net/screenshot?&url=${encodeURIComponent(
          url
        )}&full_page=true&output=image&file_type=png`;

        // Téléchargement de l’image dans le serveur
        const imgPath = path.join(__dirname, `screenshot_${Date.now()}.png`);
        const response = await axios.get(screenshotUrl, {
          responseType: "arraybuffer",
        });

        fs.writeFileSync(imgPath, response.data);

        // Upload vers Facebook
        const form = new FormData();
        form.append("recipient", JSON.stringify({ id: senderId }));
        form.append("message", JSON.stringify({ attachment: { type: "image", payload: {} } }));
        form.append("filedata", fs.createReadStream(imgPath));

        await axios.post(
          `https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`,
          form,
          { headers: form.getHeaders() }
        );

        // Supprimer le fichier temporaire
        fs.unlinkSync(imgPath);

      } catch (err) {
        console.error("Screenshot ERROR:", err.message || err);

        await sendMessage(
          senderId,
          { text: `❌ Unable to screenshot: ${url}` },
          pageAccessToken
        );
      }
    }
  }
};
