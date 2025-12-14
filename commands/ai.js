const axios = require("axios");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

const IMGBB_API_KEY = "2ef14dcf2beb6dbe0c444790faed0cc0";

// ============================
// Upload image to ImgBB
// ============================
async function uploadToImgBB(url) {
  try {
    const img = await axios.get(url, { responseType: "arraybuffer" });
    const form = new FormData();
    form.append("image", Buffer.from(img.data).toString("base64"));

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    return upload.data.data.url;
  } catch (e) {
    console.error("❌ ImgBB Error:", e.message);
    return null;
  }
}

// ============================
// Split long messages
// ============================
function splitMessage(text, max = 1800) {
  return text.match(new RegExp(`.{1,${max}}`, "g")) || [];
}

// ============================
// COMMANDE AI
// ============================
module.exports = {
  name: "ai",
  description: "Answer all questions and analyze images",
  usage: "[text or image]",
  author: "coffee",

  // =====================================
  // Fonction principale (appelable manuellement si besoin)
  // =====================================
  async execute(senderId, args, token, event) {
    const message = args.join(" ").trim() || "Analyse cette image";
    let imgURL = "";

    // -----------------------------
    // 📸 Détection d'image reply
    // -----------------------------
    if (
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments[0]?.type === "photo"
    ) {
      const imageLink = event.messageReply.attachments[0].url;
      imgURL = await uploadToImgBB(imageLink);
      console.log("📸 ImgBB URL:", imgURL);
    }

    const header = "💬 | Anime Focus AI\n・────────────・\n";
    const footer = "\n・──── >ᴗ< ─────・";

    try {
      // -----------------------------
      // 🌐 API GPT-5 Nano
      // -----------------------------
      const res = await axios.get(
        "https://api.nekolabs.web.id/text-generation/gpt/5-nano",
        {
          params: {
            text: message,
            imageUrl: imgURL,
            sessionId: senderId
          }
        }
      );

      if (!res.data?.success) throw new Error("API Error");

      const aiText = res.data.result.trim();
      const chunks = splitMessage(aiText);

      for (let i = 0; i < chunks.length; i++) {
        let txt = chunks[i];
        if (i === 0) txt = header + txt;
        if (i === chunks.length - 1) txt += footer;
        await sendMessage(senderId, { text: txt }, token);
      }

    } catch (e) {
      console.error("❌ AI Error:", e.message);
      await sendMessage(
        senderId,
        { text: header + "❌ Impossible d’analyser l’image ou le texte." + footer },
        token
      );
    }
  },

  // =====================================
  // Fonction automatique pour détecter image sans taper 'ai'
  // =====================================
  async auto(senderId, imageUrl, token) {
    const imgURL = await uploadToImgBB(imageUrl);
    if (!imgURL) return sendMessage(senderId, { text: "❌ Image invalide." }, token);

    const header = "💬 | Anime Focus AI\n・────────────・\n";
    const footer = "\n・──── >ᴗ< ─────・";

    try {
      const res = await axios.get(
        "https://api.nekolabs.web.id/text-generation/gpt/5-nano",
        {
          params: {
            text: "Analyse cette image",
            imageUrl: imgURL,
            sessionId: senderId
          }
        }
      );

      if (!res.data?.success) throw new Error();

      const chunks = splitMessage(res.data.result.trim());
      for (let i = 0; i < chunks.length; i++) {
        let txt = chunks[i];
        if (i === 0) txt = header + txt;
        if (i === chunks.length - 1) txt += footer;
        await sendMessage(senderId, { text: txt }, token);
      }

    } catch (e) {
      await sendMessage(senderId, { text: header + "❌ Impossible d’analyser l’image." + footer }, token);
    }
  }
};
