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

    // Message temporaire de chargement
    await message.reply("🎨 | Generating your anime image, please wait...");

    try {
      const response = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);
      const data = response.data;

      if (!data || data.status !== "success" || !data.url) {
        return message.reply("❌ Failed to generate image. Try a different prompt.");
      }

      const caption = `
✨ Your Anime Image is Ready! ✨

🎨 Prompt: ${prompt}
🖌 Operator: ${data.operator}
      `.trim();

      // Envoyer l'image directement via l'URL
      await message.reply({
        body: caption,
        attachment: data.url
      });

    } catch (err) {
      console.error(err);
      await message.reply("❌ An error occurred while generating the image. Try again later.");
    }
  }
};
