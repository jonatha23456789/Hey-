const axios = require("axios");

module.exports = {
  name: "imagine",
  description: "Create anime image from a prompt",
  author: "Hk",
  usage: "-imagine <prompt>",

  async execute(senderId, args, pageAccessToken, event, api) {
    const prompt = args.join(" ") || "Anime";

    // Message de chargement
    const loadingMessage = await api.sendMessage(senderId, { text: "🎨 | Generating your anime image, please wait..." }, pageAccessToken);

    try {
      const res = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);
      const data = res.data;

      if (!data || data.status !== "success" || !data.url) {
        return api.sendMessage(senderId, { text: "❌ Failed to generate image." }, pageAccessToken);
      }

      const caption = `
✨ 𝓐𝓷𝓲𝓶𝓪𝓖𝓲𝓷𝓮 ✨

🖌️ Prompt: ${prompt}
🌸 Api Credit: Hk
      `.trim();

      // Supprime le message de loading (si possible)
      if (loadingMessage && loadingMessage.message_id) {
        await api.unsendMessage(loadingMessage.message_id);
      }

      // Envoi l'image
      await api.sendMessage(senderId, {
        body: caption,
        attachment: data.url
      }, pageAccessToken);

    } catch (err) {
      console.error(err);
      await api.sendMessage(senderId, { text: "❌ Failed to generate image." }, pageAccessToken);
    }
  }
};
