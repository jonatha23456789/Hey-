const axios = require("axios");
const FormData = require("form-data");
const { sendMessage } = require("../handles/sendMessage");

const IMGBB_API_KEY = "2ef14dcf2beb6dbe0c444790faed0cc0";

// ============================
// 🖼️ Upload image to ImgBB
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
// ✂ Split long text (FB limit)
// ============================
function splitMessage(text, max = 1800) {
  return text.match(new RegExp(`.{1,${max}}`, "g")) || [];
}

// ============================
// 🤖 AI COMMAND
// ============================
module.exports = {
  name: "ai",
  description: "Answer all questions and analyze & describe images",
  usage: "ai <question> OR reply to an image",
  author: "coffee",

  async execute(senderId, args, token, event) {
    const question = args.join(" ").trim() || "Describe this image";
    let imageUrl = "";

    // ============================
    // 📸 Detect image (reply)
    // ============================
    if (
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments[0]?.type === "photo"
    ) {
      const imageLink = event.messageReply.attachments[0].url;
      imageUrl = await uploadToImgBB(imageLink);
    }

    const header = "💬 | Anime Focus AI\n・────────────・\n";
    const footer = "\n・──── >ᴗ< ─────・";

    try {
      // ============================
      // 🌐 GPT-5 Nano Vision API
      // ============================
      const res = await axios.get(
        "https://api.nekolabs.web.id/text-generation/gpt/5-nano",
        {
          params: {
            text: question,
            imageUrl: imageUrl || "",
            sessionId: senderId
          }
        }
      );

      if (!res.data?.success) {
        throw new Error("API failed");
      }

      const answer = res.data.result.trim();
      const parts = splitMessage(answer);

      for (let i = 0; i < parts.length; i++) {
        let msg = parts[i];
        if (i === 0) msg = header + msg;
        if (i === parts.length - 1) msg += footer;

        await sendMessage(senderId, { text: msg }, token);
      }

    } catch (e) {
      console.error("❌ AI Error:", e.message);
      await sendMessage(
        senderId,
        {
          text:
            header +
            "❌ I couldn’t process your request. Please try again." +
            footer
        },
        token
      );
    }
  }
};
