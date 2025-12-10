const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

global.youtubeChoices = {}; // senderId → liste de résultats

module.exports = {
  name: "video",
  description: "Recherche et téléchargement YouTube",
  usage: "video <mot clé>",
  author: "coffee",

  async execute(senderId, args, token, event) {
    const userMsg = event.message.text.trim();

    // --------------------------------------------------
    // 1️⃣ SI L'UTILISATEUR ENVOIE JUSTE UN CHIFFRE
    // --------------------------------------------------
    if (!isNaN(userMsg) && youtubeChoices[senderId]) {
      const index = parseInt(userMsg);

      const list = youtubeChoices[senderId];
      if (!list[index - 1]) {
        return sendMessage(senderId, { text: "❌ Numéro invalide." }, token);
      }

      const selected = list[index - 1];

      await sendMessage(senderId, { text: `🎬 Téléchargement : ${selected.title}` }, token);

      // ---- Téléchargement ----
      try {
        const dl = await axios.get(
          `https://api.nekolabs.web.id/downloader/youtube?url=${encodeURIComponent(selected.url)}`
        );

        if (!dl.data.success) {
          return sendMessage(senderId, { text: "❌ Impossible de télécharger." }, token);
        }

        const videoURL = dl.data.result.video.url;

        const file = await axios.get(videoURL, { responseType: "arraybuffer" });

        await sendMessage(
          senderId,
          {
            attachment: file.data,
            type: "video",
            ext: "mp4"
          },
          token
        );
      } catch (err) {
        console.log("DL error:", err.response?.data || err.message);
        return sendMessage(senderId, { text: "❌ Erreur en envoyant la vidéo." }, token);
      }

      delete youtubeChoices[senderId];
      return;
    }

    // --------------------------------------------------
    // 2️⃣ MODE RECHERCHE NORMAL
    // --------------------------------------------------
    const query = args.join(" ");
    if (!query) {
      return sendMessage(senderId, { text: "❌ Exemple : video naruto" }, token);
    }

    let req = await axios.get(
      `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`
    );

    const results = req.data.result;

    if (!results || results.length === 0) {
      return sendMessage(senderId, { text: "❌ Aucune vidéo trouvée." }, token);
    }

    // Sauvegarde choix
    youtubeChoices[senderId] = results;

    let txt = `🔎 Résultats pour : *${query}*\n\n`;
    results.forEach((v, i) => {
      txt += `${i + 1}️⃣ ${v.title}\n${v.channel} • ${v.duration}\n\n`;
    });

    txt += "👉 Envoie juste le **numéro** de la vidéo.\nEx : 3";

    await sendMessage(senderId, { text: txt }, token);
  }
};
