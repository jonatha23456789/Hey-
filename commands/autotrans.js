const axios = require("axios");

let autoTranslateState = {
    enabled: false,
    targetLang: "en"
};

module.exports = {
    name: "autotrans",

    async execute(senderId, args, pageAccessToken, event, sendMessage) {
        const state = args[0];
        const lang = args[1];

        if (!state) {
            return sendMessage(senderId, { text: "Usage : autotrans <on/off> <lang>" }, pageAccessToken);
        }

        if (state === "on") {
            if (!lang) {
                return sendMessage(senderId, { text: "Tu dois ajouter une langue : ex. autotrans on en" }, pageAccessToken);
            }

            autoTranslateState.enabled = true;
            autoTranslateState.targetLang = lang;

            return sendMessage(senderId, { text: `🌍 Auto-traduction activée → ${lang}` }, pageAccessToken);
        }

        if (state === "off") {
            autoTranslateState.enabled = false;
            return sendMessage(senderId, { text: "❌ Auto-traduction désactivée." }, pageAccessToken);
        }

        return sendMessage(senderId, { text: "Commande invalide." }, pageAccessToken);
    },

    // 🔥 Fonction auto appelée dans handleMessage
    async auto(senderId, message, pageAccessToken, sendMessage) {
        if (!autoTranslateState.enabled) return;

        try {
            const res = await axios.get(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(message)}&langpair=auto|${autoTranslateState.targetLang}`
            );

            const translated = res.data.responseData.translatedText;

            await sendMessage(senderId, {
                text: `🔄 Traduction (${autoTranslateState.targetLang}) :\n${translated}`
            }, pageAccessToken);

        } catch (e) {
            console.error("Translation error:", e);
        }
    }
};
