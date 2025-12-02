const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "wanted",
    version: "1.1",
    author: "AmineDev",
    countDown: 2,
    role: 0,
    shortDescription: "Génère un poster WANTED",
    longDescription: "Crée un poster WANTED avec l'avatar de l'utilisateur",
    category: "fun",
    guide: "{pn} @tag ou {pn}"
  },

  onStart: async function ({ event, message, usersData }) {
    try {

      // --- 1. Identifier l’utilisateur ciblé ---
      let mention = Object.keys(event.mentions);
      let uid;

      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      } else if (mention.length > 0) {
        uid = mention[0];
      } else {
        uid = event.senderID;
      }

      // --- 2. Récupérer l’avatar ---
      let url = await usersData.getAvatarUrl(uid);
      if (!url) return message.reply("❌ Impossible de récupérer la photo de profil.");

      // --- 3. Générer l’image WANTED avec DIG ---
      let imgBuffer = await new DIG.Wanted().getImage(url);

      // --- 4. Sauvegarde temporaire ---
      const pathSave = `${__dirname}/tmp/wanted_${uid}.png`;
      fs.writeFileSync(pathSave, Buffer.from(imgBuffer));

      // --- 5. Envoyer l’image ---
      const username = event.mentions[uid] || "User";
      message.reply({
        body: `📜 WANTED POSTER\n👤 Cible : ${username}`,
        attachment: fs.createReadStream(pathSave)
      }, () => fs.unlinkSync(pathSave));

    } catch (err) {
      console.error(err);
      message.reply("❌ Erreur lors de la création du poster WANTED.");
    }
  }
};
