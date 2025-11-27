const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

const aspectRatioMap = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 756 },
  "9:16": { width: 756, height: 1344 },
  "3:2": { width: 1536, height: 1024 },
  "2:3": { width: 1024, height: 1536 },
};

module.exports = {
  name: "nijix",
  description: "Generate an anime-style image from a prompt using Nijix AI",
  usage: "-nijix <prompt> [--ar <ratio>]",
  author: "Vincenzo",

  async execute(senderId, args, pageAccessToken) {
    let prompt = args.join(" ").trim();
    if (!prompt) return sendMessage(senderId, { text: "❌ Please provide a prompt." }, pageAccessToken);

    // Vérifie le ratio
    const arMatch = prompt.match(/--ar (\d+:\d+)/);
    const aspectRatio = arMatch ? arMatch[1] : "1:1";
    const dimensions = aspectRatioMap[aspectRatio] || aspectRatioMap["1:1"];

    // Nettoie le prompt
    prompt = prompt.replace(/--ar \d+:\d+/, "").trim();

    const tmpFile = path.join(__dirname, `nijix_${Date.now()}.png`);

    try {
      await sendMessage(senderId, { text: "⏳ Generating your image..." }, pageAccessToken);

      // Étape 1: Rejoindre la queue
      await axios.post("https://asahina2k-animagine-xl-3-1.hf.space/queue/join", {});

      // Étape 2: Envoyer le prompt
      const { data } = await axios.post("https://asahina2k-animagine-xl-3-1.hf.space/queue/data", {
        prompt,
        width: dimensions.width,
        height: dimensions.height,
      });

      if (!data || !data.image) {
        return sendMessage(senderId, { text: "❌ Failed to generate image." }, pageAccessToken);
      }

      // Étape 3: Télécharger l’image
      const imageResponse = await axios.get(data.image, { responseType: "arraybuffer" });
      fs.writeFileSync(tmpFile, imageResponse.data);

      // Étape 4: Upload Messenger
      const form = new FormData();
      form.append("message", JSON.stringify({ attachment: { type: "image", payload: { is_reusable: true } } }));
      form.append("filedata", fs.createReadStream(tmpFile));

      const uploadRes = await axios.post(
        `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

      const attachmentId = uploadRes.data.attachment_id;
      await axios.post(`https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`, {
        recipient: { id: senderId },
        message: { attachment: { type: "image", payload: { attachment_id: attachmentId } } },
      });

    } catch (e) {
      console.error("Nijix Command Error:", e.response?.data || e.message);
      await sendMessage(senderId, { text: "❌ An error occurred while generating the image." }, pageAccessToken);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  },
};
