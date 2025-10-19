const axios = require("axios");
const { sendMessage, deleteMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Create a beautiful anime image from prompt",
  author: "Hk",

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) return sendMessage(senderId, { text: "❌ Provide a prompt." }, pageAccessToken);

    try {
      // 1️⃣ Envoie le message de loading et garde l'ID
      const loading = await sendMessage(senderId, { text: "🎨 | Generating your anime image, please wait..." }, pageAccessToken);

      const prompt = args.join(" ");
      const res = await axios.get(`https://arychauhann.onrender.com/api/animagine?prompt=${encodeURIComponent(prompt)}`);

      if (!res.data.url) {
        // Supprime le message loading si échec
        await deleteMessage(loading.messageId, pageAccessToken);
        return sendMessage(senderId, { text: "❌ No image returned by API." }, pageAccessToken);
      }

      // 2️⃣ Supprime le message loading
      await deleteMessage(loading.messageId, pageAccessToken);

      // 3️⃣ Envoie l'image avec le texte
      await sendMessage(senderId, {
        body: `✨ Prompt: ${prompt}\n🌟 Credit: Hk`,
        attachment: {
          type: "image",
          payload: { url: res.data.url }
        }
      }, pageAccessToken);

    } catch (err) {
      console.error(err);
      sendMessage(senderId, { text: "❌ Failed to generate image." }, pageAccessToken);
    }
  }
};
