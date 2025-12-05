const axios = require('axios');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

// ============================
// 🔥 CONFIG
// ============================
const IMGBB_API_KEY = "2ef14dcf2beb6dbe0c444790faed0cc0";

// ============================
// 🖼️ UPLOAD IMAGE TO IMGBB
// ============================
async function uploadToImgBB(url) {
  try {
    // 1. Download image
    const img = await axios.get(url, { responseType: "arraybuffer" });

    // 2. Prepare upload
    const form = new FormData();
    form.append("image", Buffer.from(img.data).toString("base64"));

    // 3. Upload
    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    return upload.data.data.url;
  } catch (e) {
    console.error("❌ ImgBB Upload Error:", e.message);
    return null;
  }
}

// ============================
// 📌 Split long messages
// ============================
function splitMessage(text) {
  const maxLength = 1900;
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

// ============================
// 🤖 COMMAND
// ============================
module.exports = {
  name: 'ai',
  description: 'Chat with GPT-5 + Image Analysis',
  usage: 'ai [text or image]',
  author: 'coffee',

  async execute(senderId, args, token, event) {
    const message = args.join(" ").trim() || "Salut 👋";
    let imgURL = null;

    // ============================
    // 📸 IF USER REPLIED TO AN IMAGE
    // ============================
    if (
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments[0]?.type === "photo"
    ) {
      const imageLink = event.messageReply.attachments[0].url;

      // Upload to ImgBB
      imgURL = await uploadToImgBB(imageLink);

      console.log("📸 Uploaded ImgBB URL:", imgURL);
    }

    const header = "💬 | Anime Focus Ai\n・────────────・\n";
    const footer = "\n・──── >ᴗ< ─────・";

    try {
      // ============================
      // 🌐 API REQUEST
      // ============================
      const apiRes = await axios.get("https://miko-utilis.vercel.app/api/gpt5", {
        params: {
          query: message,
          userId: senderId,
          imgurl: imgURL || ""
        }
      });

      if (!apiRes.data || !apiRes.data.status) throw new Error("API error");

      let ai = apiRes.data.data.response.trim();

      const chunks = splitMessage(ai);

      for (let i = 0; i < chunks.length; i++) {
        let txt = chunks[i];
        if (i === 0) txt = header + txt;
        if (i === chunks.length - 1) txt = txt + footer;

        await sendMessage(senderId, { text: txt }, token);
      }

    } catch (e) {
      console.error("❌ AI Error:", e.message);

      await sendMessage(
        senderId,
        { text: header + "❌ Erreur lors du traitement de l'image." + footer },
        token
      );
    }
  }
};
