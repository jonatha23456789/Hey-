const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

// 🔐 ID ADMIN (TON PSID)
const ADMIN_ID = "8592033747492364; // ← mets ton PSID ici

// 📅 Date / heure
function getDateTime() {
  const now = new Date();
  return now.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

module.exports = {
  name: "call",
  description: "Contact the admin via the pagebot",
  usage: "callad <your message>",
  author: "Kelvin",

  async execute(senderId, args, pageAccessToken) {
    const userMessage = args.join(" ").trim();

    if (!userMessage) {
      return sendMessage(
        senderId,
        { text: "⚠️ Usage:\ncallad <your message>" },
        pageAccessToken
      );
    }

    const dateTime = getDateTime();

    const adminText =
`📩 | NEW MESSAGE (CALLAD)
・────────────・

👤 User ID:
${senderId}

📝 Message:
${userMessage}

📅 ${dateTime}
・──── >ᴗ< ─────・`;

    try {
      // 📤 envoyer au créateur
      await sendMessage(
        ADMIN_ID,
        { text: adminText },
        pageAccessToken
      );

      // ✅ confirmation utilisateur
      await sendMessage(
        senderId,
        { text: "✅ Your message has been sent to the admin. You will be contacted soon." },
        pageAccessToken
      );

    } catch (error) {
      console.error("CALLAD Error:", error.message || error);
      await sendMessage(
        senderId,
        { text: "❌ Failed to contact the admin. Please try again later." },
        pageAccessToken
      );
    }
  }
};
