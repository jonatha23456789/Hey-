const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

global.youtubeChoices = {}; // stockage temporaire : senderId → liste des vidéos

module.exports = {
  name: "video",
  description: "Recherche et téléchargement YouTube",
  usage: "youtube <mot clé>",
  author: "coffee",

  // ==========================================================
  // 🟦 MODE NORMAL → RECHERCHE
  // ==========================================================
  async execute(senderId, args, token, event) {
    const isReply = event.messageReply && youtubeChoices[senderId];

    // ========================================================
    // 🟪 SI L'UTILISATEUR REPOND AVEC UN NUMÉRO
    // ========================================================
    if (isReply) {
      const choiceIndex = parseInt(args[0]);

      if (isNaN(choiceIndex) || choiceIndex < 1 || choiceIndex > youtubeChoices[senderId].length) {
        return sendMessage(senderId, { text: "❌ | Numéro invalide." }, token);
      }

      const selected = youtubeChoices[senderId][choiceIndex - 1];

      await sendMessage(senderId, { text: `🎬 Téléchargement : ${selected.title}` }, token);

      // Télécharger la vidéo via l'API
      let dl;
      try {
        dl = await axios.get(
          `https://api.nekolabs.web.id/downloader/youtube?url=${encodeURIComponent(selected.url)}`
        );
      } catch {
        dl = null;
      }

      if (!dl || !dl.data || !dl.data.success) {
        return sendMessage(senderId, { text: "❌ | Impossible de télécharger." }, token);
      }

      const videoURL = dl.data.result.video.url;

      try {
        const fileBuffer = await axios.get(videoURL, { responseType: "arraybuffer" });

        await sendMessage(
          senderId,
          {
            attachment: {
              type: "video",
              payload: { is_reusable: true }
            },
            filedata: fileBuffer.data
          },
          token
        );

      } catch (err) {
        return sendMessage(senderId, { text: "❌ | Erreur en envoyant la vidéo." }, token);
      }

      delete youtubeChoices[senderId];
      return;
    }

    // ==========================================================
    // 🟦 MODE RECHERCHE
    // ==========================================================
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

    // Stock les résultats
    youtubeChoices[senderId] = results;

    // ===========================================
    // 🟩 SYSTÈME ANTI ERREUR (limite Messenger 2000)
    // ===========================================
    let msg = `🔎 Résultats pour : **${query}**\n\n`;

    for (let i = 0; i < results.length; i++) {
      const v = results[i];
      const line =
        `${i + 1}️⃣ *${v.title}*\n${v.channel} • ${v.duration}\n\n`;

      if ((msg + line).length >= 1800) {
        msg += "⚠️ Liste réduite (limite Messenger atteinte).\n\n";
        break;
      }

      msg += line;
    }

    msg += "👉 Réponds à **ce message** avec le **numéro**.\nExemple : 3";

    return sendMessage(senderId, { text: msg }, token);
  },

  // ==========================================================
  // 🟥 MODE REPLY
  // ==========================================================
  async reply(senderId, messageText, token, event) {
    const number = parseInt(messageText);
    return module.exports.execute(senderId, [number], token, event);
  }
};
