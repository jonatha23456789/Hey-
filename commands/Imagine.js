const axios = require("axios");

module.exports = {
  config: {
    name: "imagine",
    version: "1.0",
    author: "Hk",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Create anime image from prompt" },
    longDescription: { en: "Generates a beautiful anime image using a prompt via API" },
    category: "fun",
    guide: { en: "imagine <prompt>" }
  },

  onStart: async function ({ message, args }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt.\nExample: imagine Anime girl");

    // Envoyer un message de chargement
    const loadingMsg = await message.reply("🎨 | Generating your anime image, please wait...");

    try {
      const response = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);
      const data = response.data;

      if (!data || data.status !== "success" || !data.url) {
        return loadingMsg.edit("❌ Failed to generate image. Please try again with a different prompt.");
      }

      const caption = `
✨ Your Anime Image is Ready! ✨

🎨 Prompt: ${prompt}
🖌 Operator: ${data.operator}
      `.trim();

      // Envoyer l'image avec le message
      await loadingMsg.edit({
        body: caption,
        attachment: data.url
      });

    } catch (err) {
      console.error(err);
      await loadingMsg.edit("❌ An error occurred while generating the image. Try again later.");
    }
  }
};
