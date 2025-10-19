const axios = require("axios");
const { sendMessage, deleteMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Create a beautiful anime image from prompt",
  author: "Hk",

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) return sendMessage(senderId, { text: "❌ Provide a prompt." }, pageAccessToken);

    try {
      // 1️⃣ Loading message
      const loading = await sendMessage(senderId, { text: "🎨 | Generating your anime image, please wait..." }, pageAccessToken);

      const prompt = args.join(" ");
      const res = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);

      console.log("API response:", res.data); // 🔍 Debug: voir ce que l'API renvoie

      if (!res.data || !res.data.url) {
        await deleteMessage(loading.messageId, pageAccessToken);
        return sendMessage(senderId, { text: "❌ API did not return an image URL." }, pageAccessToken);
      }

      await deleteMessage(loading.messageId, pageAccessToken);

      await sendMessage(senderId, {
        body: `✨ Prompt: ${prompt}\n🌟 Credit: Hk`,
        attachment: {
          type: "image",
          payload: { url: res.data.url }
        }
      }, pageAccessToken);

    } catch (err) {
      console.error("Error generating image:", err);
      sendMessage(senderId, { text: "❌ Failed to generate image." }, pageAccessToken);
    }
  }
};
