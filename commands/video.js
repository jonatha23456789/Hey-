const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

global.youtubeChoices = {}; 

// Fonction pour envoyer du texte en respectant la limite de 2000 caractères
async function sendLongMessage(senderId, text, token) {
  const parts = text.match(/[\s\S]{1,1800}/g) || [];

  for (const part of parts) {
    await sendMessage(senderId, { text: part }, token);
  }
}

module.exports = {
  name: "video",
  description: "Recherche et téléchargement YouTube",
  usage: "youtube <mot clé>",
  author: "coffee",

  // --------------- EXECUTE (recherche + reply) -------------------
  async execute(senderId, args, token, event) {
    const isReply = event.messageReply && youtubeChoices[senderId];

    // ------- SI REPLY PAR UN NUMÉRO -------
    if (isReply) {
      const choiceIndex = parseInt(args[0]);

      if (isNaN(choiceIndex) || choiceIndex < 1 || choiceIndex > youtubeChoices[senderId].length) {
        return sendMessage(senderId, { text: "❌ | Numéro invalide." }, token);
      }

      const selected = youtubeChoices[senderId][choiceIndex - 1];

      await sendMessage(senderId, { text: `🎬 Téléchargement : ${selected.title}` }, token);

      // Télécharger
      let dl;
      try {
        dl = await axios.get(
          `https://api.nekolabs.web.id/downloader/youtube?url=${encodeURIComponent(selected.url)}`
        );
      } catch {
        return sendMessage(senderId, { text: "❌ | Erreur API download." }, token);
      }

      if (!dl?.data?.success) {
        return sendMessage(senderId, { text: "❌ | Téléchargement impossible." }, token);
      }

      const videoURL = dl.data.result.video.url;

      try {
        const file = await axios.get(videoURL, { responseType: "arraybuffer" });

        await sendMessage(
          senderId,
          {
            attachment: { type: "video", payload: { is_reusable: true } },
            filedata: file.data
          },
          token
        );
      } catch {
        return sendMessage(senderId, { text: "❌ | Erreur en envoyant la vidéo." }, token);
      }

      delete youtubeChoices[senderId];
      return;
    }

    // ---------------- RECHERCHE NORMALE ----------------
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

    let message = `🔎 Résultats pour : *${query}*\n\n`;

    results.forEach((v, i) => {
      message += `#${i + 1} → ${v.title}\n`;
      message += `${v.channel} • ${v.duration}\n\n`;
    });

    message += "👉 Réponds **à mon message** avec un numéro.\nExemple : 3";

    // Envoi split
    await sendLongMessage(senderId, message, token);
  },

  // ---- Reply handler ----
  async reply(senderId, messageText, token, event) {
    const number = parseInt(messageText);
    return module.exports.execute(senderId, [number], token, event);
  }
};
