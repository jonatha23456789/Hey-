const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

global.youtubeChoices = {}; // stockage temporaire des listes

module.exports = {
  name: "video",
  description: "Recherche et téléchargement YouTube",
  usage: "youtube <mot clé>",
  author: "coffee",

  async execute(senderId, args, token, event) {
    // ============================
    // 📌 SI L’UTILISATEUR REPOND PAR UN NUMÉRO
    // ============================
    if (event.messageReply && youtubeChoices[senderId]) {
      const choice = parseInt(args[0]);

      if (isNaN(choice) || choice < 1 || choice > youtubeChoices[senderId].length) {
        return sendMessage(senderId, { text: "❌ | Numéro invalide." }, token);
      }

      const selected = youtubeChoices[senderId][choice - 1];

      await sendMessage(senderId, { text: `🎬 Téléchargement de : ${selected.title}` }, token);

      // API pour télécharger la vidéo
      const dl = await axios.get(
        `https://api.nekolabs.web.id/downloader/youtube?url=${encodeURIComponent(selected.url)}`
      ).catch(() => null);

      if (!dl || !dl.data || !dl.data.success) {
        return sendMessage(senderId, { text: "❌ | Impossible de télécharger la vidéo." }, token);
      }

      const videoURL = dl.data.result.video.url;

      try {
        const file = await axios.get(videoURL, { responseType: "arraybuffer" });

        await sendMessage(
          senderId,
          {
            attachment: {
              type: "video",
              payload: {
                is_reusable: true
              }
            },
            filedata: file.data,
          },
          token
        );

      } catch (err) {
        return sendMessage(senderId, { text: "❌ | Erreur en envoyant la vidéo." }, token);
      }

      delete youtubeChoices[senderId];
      return;
    }

    // ============================
    // 📌 MODE RECHERCHE NORMALE
    // ============================
    const query = args.join(" ");
    if (!query) {
      return sendMessage(senderId, { text: "❌ | Exemple : youtube zero two" }, token);
    }

    const req = await axios.get(
      `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`
    );

    const results = req.data.result;

    if (!results || results.length === 0) {
      return sendMessage(senderId, { text: "❌ | Aucune vidéo trouvée." }, token);
    }

    youtubeChoices[senderId] = results;

    let text = `🔎 Résultats pour : **${query}**\n\n`;
    results.forEach((v, i) => {
      text += `${i + 1}️⃣ ${v.title}\n${v.channel} | ${v.duration}\n\n`;
    });

    text += "👉 Réponds à ce message avec le numéro de la vidéo.\nExemple : 3";

    await sendMessage(senderId, { text }, token);
  }
};
