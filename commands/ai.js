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
  } catch {
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
// EXPORT AUTO FUNCTION
// ============================
module.exports.autoImage = async function (senderId, imageUrl, token) {
  const imgURL = await uploadToImgBB(imageUrl);

  if (!imgURL) {
    return sendMessage(senderId, { text: "❌ Image invalide." }, token);
  }

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

    const parts = splitMessage(res.data.result.trim());

    for (let i = 0; i < parts.length; i++) {
      let msg = parts[i];
      if (i === 0) msg = header + msg;
      if (i === parts.length - 1) msg += footer;

      await sendMessage(senderId, { text: msg }, token);
    }
  } catch {
    await sendMessage(
      senderId,
      { text: header + "❌ Impossible d’analyser l’image." + footer },
      token
    );
  }
};
