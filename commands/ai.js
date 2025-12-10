const axios = require("axios");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

const IMGBB_API_KEY = "2ef14dcf2beb6dbe0c444790faed0cc0";

// Upload image to ImgBB
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

// Split long messages
function splitMessage(text) {
  const maxLength = 1800;
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

module.exports = {
  name: "ai",
  description: "GPT + Vision améliorée",
  usage: "ai [text or image]",
  author: "coffee",

  async execute(senderId, args, token, event) {
    const message = args.join(" ").trim() || "Salut 👋";
    let imgURL = null;

    // Detect image reply
    if (
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments[0]?.type === "photo"
    ) {
      const imageLink = event.messageReply.attachments[0].url;
      imgURL = await uploadToImgBB(imageLink);
      console.log("📸 ImgBB:", imgURL);
    }

    const header = "💬 | Anime Focus Ai\n・────────────・\n";
    const footer = "\n・──── >ᴗ< ─────・";

    // ========= TRY PRIMARY API (Nekolabs Vision) =========
    async function askNeko() {
      try {
        const res = await axios.get(
          "https://api.nekolabs.web.id/text-generation/gemini/2.5-flash-lite/v2",
          {
            params: {
              text: message,
              imageUrl: imgURL || "",
              sessionId: senderId,
              vision: true
            }
          }
        );

        if (!res.data.success) return null;
        return res.data.result.trim();
      } catch (e) {
        return null;
      }
    }

    // ========= SECOND API (super analyse d’image) =========
    async function askVisionFallback() {
      try {
        const res = await axios.post(
          "https://api.ryzendesu.vip/api/ai/vision",
          {
            prompt: message,
            image: imgURL
          }
        );

        return res.data.result || null;
      } catch (e) {
        return null;
      }
    }

    // ========= EXECUTE AI =========
    let aiResponse = await askNeko();

    if (!aiResponse) {
      console.log("⚠ Nekolabs failed → fallback vision activated");
      aiResponse =
        (await askVisionFallback()) ||
        "❌ Je n’ai pas pu analyser l’image, réessaie avec une autre.";
    }

    // ========= SEND IN CHUNKS =========
    const chunks = splitMessage(aiResponse);

    for (let i = 0; i < chunks.length; i++) {
      let txt = chunks[i];
      if (i === 0) txt = header + txt;
      if (i === chunks.length - 1) txt = txt + footer;
      await sendMessage(senderId, { text: txt }, token);
    }
  }
};
