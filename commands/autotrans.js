const axios = require("axios");

// Mémoire locale : langue activée par utilisateur
// { userId: "fr", userId2: "en" }
const autoTranslateState = {};

module.exports = {
  name: "autotrans",
  description: "Automatically translate all messages into a chosen language.",
  author: "coffee",

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    const option = args[0];
    const lang = args[1];

    if (!option) {
      return sendMessage(
        senderId,
        { text: "Usage: auto translate <on/off> <lang>\nEx: auto translate on en" },
        pageAccessToken
      );
    }

    // ====== ACTIVER ======
    if (option.toLowerCase() === "on") {
      if (!lang)
        return sendMessage(
          senderId,
          { text: "❗ Choisis une langue. Exemple : auto translate on en" },
          pageAccessToken
        );

      autoTranslateState[senderId] = lang.toLowerCase();

      return sendMessage(
        senderId,
        {
          text: `✅ Auto-translation activée.\n📌 Langue cible : *${lang.toUpperCase()}*`
        },
        pageAccessToken
      );
    }

    // ====== DÉSACTIVER ======
    if (option.toLowerCase() === "off") {
      delete autoTranslateState[senderId];

      return sendMessage(
        senderId,
        { text: "🛑 Auto-translation désactivée." },
        pageAccessToken
      );
    }

    // Mauvaise syntaxe
    return sendMessage(
      senderId,
      { text: "Usage: auto translate <on/off> <lang>" },
      pageAccessToken
    );
  },

  // Fonction appelée automatiquement dans handleMessage
  async auto(senderId, text, pageAccessToken, sendMessage) {
    const lang = autoTranslateState[senderId];
    if (!lang) return; // pas activé → on ignore

    try {
      const url = `https://miko-utilis.vercel.app/api/translate?to=${lang}&text=${encodeURIComponent(
        text
      )}`;

      const res = await axios.get(url);
      const translated = res.data.translated_text.translated;

      await sendMessage(
        senderId,
        { text: `🌐 *Translated (${lang}):*\n${translated}` },
        pageAccessToken
      );
    } catch (err) {
      console.error("Auto translate error:", err.message);
      await sendMessage(
        senderId,
        { text: "❌ Erreur lors de la traduction automatique." },
        pageAccessToken
      );
    }
  }
};
