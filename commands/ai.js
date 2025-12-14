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
function splitMessage(text, maxLength = 1800) {
  return text.match(new RegExp(`.{1,${maxLength}}`, "g")) || [];
}

// ============================
// Fonction auto → analyse texte ou image
// ============================
module.exports.auto = async function(senderId, imageUrl = "", pageAccessToken, text = "") {
  let imgURL = "";
  if (imageUrl) {
    imgURL = await uploadToImgBB(imageUrl);
    if (!imgURL) {
      return sendMessage(senderId, { text: "❌ Impossible d’uploader l’image." }, pageAccessToken);
    }
  }

  const prompt = text || "Analyse cette image et décris-la.";

  const header = "💬 | Anime Focus Ai\n・────────────・\n";
  const footer = "\n・──── >ᴗ< ─────・";

  try {
    const res = await axios.get(
      "https://api.nekolabs.web.id/text-generation/gpt/5-nano",
      {
        params: {
          text: prompt,
          imageUrl: imgURL,
          sessionId: senderId
        }
      }
    );

    if (!res.data?.success) {
      throw new Error("API returned error");
    }

    const aiText = res.data.result.trim();
    const chunks = splitMessage(aiText);

    for (let i = 0; i < chunks.length; i++) {
      let msg = chunks[i];
      if (i === 0) msg = header + msg;
      if (i === chunks.length - 1) msg += footer;
      await sendMessage(senderId, { text: msg }, pageAccessToken);
    }

  } catch (e) {
    console.error("❌ AI Error:", e.message);
    await sendMessage(
      senderId,
      { text: header + "❌ Impossible d’analyser l’image ou le texte." + footer },
      pageAccessToken
    );
  }
};
