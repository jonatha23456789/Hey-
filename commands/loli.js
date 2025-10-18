const axios = require("axios");

module.exports = {
  name: "loli",
  description: "Send a random loli image",
  author: "Hk",
  cooldown: 5,

  async execute(event, api) {
    const { threadID, messageID } = event;

    // Message de chargement
    const loading = await api.sendMessage("🎀 Fetching a cute random loli...", threadID, messageID);

    try {
      // On récupère le lien direct de l'image
      const res = await axios.get("https://archive.lick.eu.org/api/random/loli", {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      // Si l’API redirige vers une image
      let imageUrl = res.headers.location || res.data.url || res.data || null;

      if (!imageUrl) {
        return api.sendMessage("❌ Unable to fetch image.", threadID, messageID);
      }

      // Envoi de l'image
      api.sendMessage(
        {
          attachment: { type: "photo", payload: { url: imageUrl } },
        },
        threadID,
        () => api.unsendMessage(loading.messageID) // Supprime le message "loading"
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ Failed to fetch loli image.", threadID, messageID);
      api.unsendMessage(loading.messageID);
    }
  },
};
