const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Create anime image from a prompt",
  author: "Hk",
  usage: "-imagine <prompt>",

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(" ") || "Anime";

    // Envoie le message de chargement
    const loading = await sendMessage(
      senderId,
      { text: "🎨 | Generating your anime image, please wait..." },
      pageAccessToken
    );

    try {
      // Appel à l'API
      const res = await axios.get(
        `https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`
      );
      const data = res.data;

      if (!data || data.status !== "success" || !data.url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate image." },
          pageAccessToken
        );
      }

      const caption = `
✨ 𝓐𝓷𝓲𝓶𝓪𝓖𝓲𝓷𝓮 ✨

🖌️ Prompt: ${prompt}
🌸 Api Credit: Hk
      `.trim();

      // Supprime le message de chargement si possible
      if (loading && loading.messageID) {
        await sendMessage(
          senderId,
          { text: "", delete: loading.messageID },
          pageAccessToken
        );
      }

      // Envoie l'image générée
      await sendMessage(
        senderId,
        {
          body: caption,
          attachment: data.url
        },
        pageAccessToken
      );

    } catch (err) {
      console.error(err);
      await sendMessage(
        senderId,
        { text: "❌ Failed to generate image." },
        pageAccessToken
      );
    }
  }
};
