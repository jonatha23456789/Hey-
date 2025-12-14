const axios = require("axios");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

const IMGBB_API_KEY = "2ef14dcf2beb6dbe0c444790faed0cc0";

const SYSTEM_PROMPT = `
You are Anime Focus Ai.

Rules:
- Do NOT greet the user.
- Do NOT ask questions.
- Do NOT sound like a chat assistant.
- Be neutral, explanatory, and direct.
- Answer only once.

Always format your response EXACTLY like this:

💬 | Anime Focus Ai
・────────────・
[Your answer here]
・──── >ᴗ< ─────・
`;

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
// COMMANDE AI
// ============================
module.exports = {
  name: "ai",
  description: "Answer all questions and analyze images",
  usage: "[text or image]",
  author: "coffee",

  // ============================
  // COMMANDE MANUELLE
  // ============================
  async execute(senderId, args, token, event) {
    const userText = args.join(" ").trim() || "Analyze the image";
    let imgURL = "";

    if (
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments[0]?.type === "photo"
    ) {
      imgURL = await uploadToImgBB(event.messageReply.attachments[0].url);
    }

    try {
      const res = await axios.get(
        "https://api.nekolabs.web.id/text-generation/gpt/5-nano",
        {
          params: {
            text: SYSTEM_PROMPT + "\nUser request:\n" + userText,
            imageUrl: imgURL,
            sessionId: senderId
          }
        }
      );

      if (!res.data?.success) throw new Error("API error");

      // ⛔ ON ENVOIE TEL QUEL
      await sendMessage(senderId, { text: res.data.result.trim() }, token);

    } catch (e) {
      await sendMessage(senderId, {
        text:
          "💬 | Anime Focus Ai\n・────────────・\n❌ Impossible d’analyser.\n・──── >ᴗ< ─────・"
      }, token);
    }
  },

  // ============================
  // MODE AUTO IMAGE (sans taper ai)
  // ============================
  async auto(senderId, imageUrl, token, text = "Analyze this image") {
    const imgURL = await uploadToImgBB(imageUrl);
    if (!imgURL) return;

    try {
      const res = await axios.get(
        "https://api.nekolabs.web.id/text-generation/gpt/5-nano",
        {
          params: {
            text: SYSTEM_PROMPT + "\nUser request:\n" + text,
            imageUrl: imgURL,
            sessionId: senderId
          }
        }
      );

      if (!res.data?.success) throw new Error();

      await sendMessage(senderId, { text: res.data.result.trim() }, token);

    } catch (e) {
      await sendMessage(senderId, {
        text:
          "💬 | Anime Focus Ai\n・────────────・\n❌ Impossible d’analyser l’image.\n・──── >ᴗ< ─────・"
      }, token);
    }
  }
};
