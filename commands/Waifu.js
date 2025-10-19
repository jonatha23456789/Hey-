const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "waifu",
  description: "Send random waifu image",
  author: "Hk",
  usage: "waifu",

  async execute(senderId, args, pageAccessToken) { // <-- on reçoit le token ici
    try {
      const loadingMsg = await sendMessage(senderId, { text: "🕐 | Chargement de ta waifu mignonne..." }, pageAccessToken);

      const res = await axios.post("https://api.lolicon.app/setu/v2", {
        r18: 0,
        num: 1
      });

      if (!res.data || !res.data.data || res.data.data.length === 0) {
        return await sendMessage(senderId, { text: "❌ | Aucune image trouvée, réessaie !" }, pageAccessToken);
      }

      const imageUrl = res.data.data[0].urls.original;

      // Supprimer le message de chargement si possible
      // (ça dépend si ton projet supporte la suppression, sinon tu peux l'ignorer)
      if (loadingMsg?.message_id) {
        await sendMessage(senderId, { message_id: loadingMsg.message_id, text: "" }, pageAccessToken);
      }

      const caption = `
✨ 𝓒𝓾𝓽𝓮 𝓦𝓪𝓲𝓯𝓾 ✨

🌸 Api Credit: Hk
      `.trim();

      // Envoi de l'image
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: { url: imageUrl, is_reusable: true }
        }
      }, pageAccessToken);

      // Envoi du texte après l'image
      await sendMessage(senderId, { text: caption }, pageAccessToken);

    } catch (err) {
      console.error(err);
      await sendMessage(senderId, { text: "❌ | Impossible de récupérer une image depuis l'API." }, pageAccessToken);
    }
  }
};
