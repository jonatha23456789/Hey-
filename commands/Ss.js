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
        // Nouvelle API ultra-stable
        const screenshotUrl = `https://image.thum.io/get/fullpage/${encodeURIComponent(url)}`;

        // Téléchargement local
        const imgPath = path.join(__dirname, `ss_${Date.now()}.png`);
        const response = await axios.get(screenshotUrl, {
          responseType: "arraybuffer",
          timeout: 25000
        });

        fs.writeFileSync(imgPath, response.data);

        // Upload vers Facebook
        const form = new FormData();
        form.append("recipient", JSON.stringify({ id: senderId }));
        form.append("message", JSON.stringify({ attachment: { type: "image", payload: {} }}));
        form.append("filedata", fs.createReadStream(imgPath));

        await axios.post(
          `https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`,
          form,
          { headers: form.getHeaders() }
        );

        // Supprimer le fichier
        fs.unlinkSync(imgPath);

      } catch (error) {
        console.error("Screenshot ERROR:", error.message || error);

        await sendMessage(
          senderId,
          { text: `❌ Unable to screenshot: ${url}` },
          pageAccessToken
        );
      }
    }
  }
};
