const axios = require("axios");
const FormData = require("form-data");

module.exports = async (msg, reply) => {
  try {
    const text = msg.body.trim();

    // 1️⃣ Recherche YouTube quand l'utilisateur écrit: yt <mot>
    if (text.startsWith("yt ")) {
      const q = text.slice(3);
      const res = await axios.get(`https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(q)}`);

      if (!res.data || !res.data.data || res.data.data.length === 0) {
        return reply("❌ Aucun résultat trouvé.");
      }

      // garder seulement 5 résultats pour éviter 2000 chars
      const results = res.data.data.slice(0, 5);

      let message = "🎬 *Résultats YouTube*\n";
      results.forEach((v, i) => {
        message += `\n${i + 1}. ${v.title}`;
      });

      global.yt_list = results; // On stocke la liste

      return reply(message + "\n\n👉 Tape juste *1, 2, 3, 4 ou 5* pour télécharger.");
    }

    // 2️⃣ L'utilisateur tape 1-5 → télécharger
    if (/^[1-5]$/.test(text)) {
      if (!global.yt_list) return reply("❌ Aucune liste trouvée.");

      const index = parseInt(text) - 1;
      const video = global.yt_list[index];

      reply("⏬ Téléchargement en cours...");

      const dl = await axios.get(`https://api.nekolabs.web.id/download/ytdl?url=${video.url}`);

      const mp4url = dl.data?.data?.url;
      if (!mp4url) return reply("❌ Erreur téléchargement.");

      // Télécharger la vidéo MP4
      const file = await axios.get(mp4url, { responseType: "arraybuffer" });

      const data = new FormData();
      data.append("file", file.data, { filename: "video.mp4" });

      await reply({
        attachment: data,
        type: "file"
      });

      return;
    }

  } catch (e) {
    console.log("SEND ERROR:", e.response?.data || e);
    return reply("❌ Erreur interne.");
  }
};
