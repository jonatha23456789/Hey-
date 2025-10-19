const axios = require("axios");

module.exports = {
  name: "imagine",
  description: "Create anime image from a prompt",
  author: "Hk",
  usage: "-imagine <prompt>",

  onStart: async function({ message, args }) {
    const prompt = args.join(" ") || "Anime";
    const loading = await message.reply("🎨 | Generating your anime image, please wait...");

    try {
      const res = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);
      const data = res.data;

      if (!data || data.status !== "success" || !data.url) {
        return loading.edit("❌ Failed to generate image.");
      }

      const caption = `
✨ 𝓐𝓷𝓲𝓶𝓪𝓖𝓲𝓷𝓮 ✨

🖌️ Prompt: ${prompt}
🌸 Api Credit: Hk
      `.trim();

      // Supprime le message loading et envoie l'image
      loading.delete();
      message.reply({
        body: caption,
        attachment: data.url
      });
    } catch (err) {
      console.error(err);
      loading.edit("❌ Failed to generate image.");
    }
  }
};
