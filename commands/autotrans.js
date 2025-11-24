const axios = require("axios");

// Mémoire interne (par user)
const autoState = {}; 
// Exemple : autoState[senderId] = { enabled: true, lang: "en" }

module.exports = {
    name: "autotranslate",
    description: "Activer/désactiver la traduction automatique",
    
    async execute(senderId, args, pageAccessToken, event, sendMessage) {
        if (!args[0]) {
            return sendMessage(senderId, { 
                text: "❗ Usage :\n- autotranslate on en\n- autotranslate on fr\n- autotranslate off" 
            }, pageAccessToken);
        }

        const action = args[0].toLowerCase();
        const lang = args[1]?.toLowerCase() || null;

        // Désactivation
        if (action === "off") {
            delete autoState[senderId];
            return sendMessage(senderId, { text: "🛑 Auto-traduction désactivée." }, pageAccessToken);
        }

        // Activation
        if (action === "on") {
            if (!lang) {
                return sendMessage(senderId, { text: "⚠️ Vous devez préciser une langue. Exemple : autotranslate on en" }, pageAccessToken);
            }

            autoState[senderId] = { enabled: true, lang };
            return sendMessage(senderId, { 
                text: `✅ Auto-traduction activée vers : **${lang}**` 
            }, pageAccessToken);
        }

        return sendMessage(senderId, { text: "❌ Commande invalide." }, pageAccessToken);
    },

    // Fonction AUTO appelée dans handleMessage()
    async auto(senderId, text, pageAccessToken, sendMessage) {
        const state = autoState[senderId];
        if (!state || !state.enabled) return; // ❌ pas activé pour cet utilisateur
        
        // Ne pas traduire une commande (-help, -ai...)
        if (text.startsWith("-")) return;

        // Traduction automatique
        try {
            const url = `https://miko-utilis.vercel.app/api/translate?to=${state.lang}&text=${encodeURIComponent(text)}`;
            const response = await axios.get(url);

            const translated = response.data?.translated_text?.translated;
            if (!translated) return;

            await sendMessage(senderId, { 
                text: `🌍 **Traduction (${state.lang}) :**\n${translated}` 
            }, pageAccessToken);

        } catch (e) {
            console.error("AutoTranslate error:", e.message);
        }
    }
};
