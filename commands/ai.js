const axios = require('axios');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

// ============================
// 🔥 CONFIG
// ============================
const IMGBB_API_KEY = "2ef14dcf2beb6dbe0c444790faed0cc0";

// ============================
// 🔤 Style Bold Custom
// ============================
function makeBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, (match, word) => {
    return `**${word}**`; // garder normal → plus de caractères "uniques"
  });
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
// 📤 Upload image to ImgBB
// ============================
async function uploadToImgBB(imageBuffer) {
  const form = new FormData();
  form.append("image", imageBuffer.toString("base64"));

  const res = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    form,
    { headers: form.getHeaders() }
  );

  return res.data.data.url;
}

// ============================
// 🤖 Command
// ============================
module.exports = {
  name: 'ai',
  description: 'Chat with GPT-5 + Image Analysis',
  usage: 'ai [message] | ai <image>',
  author: 'coffee',

  async execute(senderId, args, token, event) {
    const textQuery = args.join(" ").trim();
    let imageURL = null;

    // ============================
    // 📸 If user sent an image
    // ============================
    if (event.messageReply && event.messageReply.attachments?.[0]?.type === "photo") {
      try {
        const img = event.messageReply.attachments[0].url;
        const imgData = await axios.get(img, { responseType: "arraybuffer" });
        imageURL = await uploadToImgBB(Buffer.from(imgData.data));
      } catch (e) {
        console.error("Image upload error:", e);
      }
    }

    // ============================
    // 🔥 Call GPT-5 API
    // ============================
    const header = "💬 | Anime Focus Ai\n・────────────・\n";
    const footer = "\n・──── >ᴗ< ─────・";

    try {
      const response = await axios.get("https://miko-utilis.vercel.app/api/gpt5", {
        params: {
          query: textQuery || "Salut",
          userId: senderId,
          imgurl: imageURL || "",
        }
      });

      if (!response.data || !response.data.status) {
        throw new Error("API returned error");
      }

      let aiResponse = response.data.data.response;

      // Clean up + styling
      aiResponse = aiResponse.trim();
      aiResponse = makeBold(aiResponse);

      const chunks = splitMessage(aiResponse);

      for (let i = 0; i < chunks.length; i++) {
        let msg = chunks[i];

        if (i === 0) msg = header + msg;
        if (i === chunks.length - 1) msg = msg + footer;

        await sendMessage(senderId, { text: msg }, token);
      }

    } catch (error) {
      console.error(error);

      await sendMessage(
        senderId,
        { text: header + "❌ Erreur lors du traitement.\nRéessaie." + footer },
        token
      );
    }
  }
};
