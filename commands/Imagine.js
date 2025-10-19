const axios = require("axios");

module.exports = {
  config: {
    name: "imagine",
    version: "1.0",
    author: "Hk",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Create anime image from prompt" },
    category: "fun",
    guide: { en: "imagine <prompt>" }
  },

  onStart: async function ({ message, args }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.");

    // Message de chargement
    const loadingMsg = await message.reply("🎨 | Generating your anime image, please wait...");

    try {
      const res = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);
      const data = res.data;

      if (!data || data.status !== "success" || !data.url) {
        return loadingMsg.edit("❌ Failed to generate image.");
      }

      // Message final avec style
      await message.reply({
        body: `
✨ Your Anime Image is Ready ✨

🎭 Prompt: ${prompt}
🖌️ Operator: ${data.operator}
        `.trim(),
        attachment: data.url
      });

      // Supprimer le message de chargement
      loadingMsg.delete();

    } catch (err) {
      console.error(err);
      await loadingMsg.edit("❌ Error while generating image.");
    }
  }
};
