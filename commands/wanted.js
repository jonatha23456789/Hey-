const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = async (senderId, user, pageAccessToken, sendMessage) => {
  try {
    // ---- 1. Récupérer la photo de l’utilisateur ----
    const avatarURL = user.photo; // URL photo Facebook

    // ---- 2. Charger le template Wanted ----
    const templateURL =
      "https://i.ibb.co/7twNd3kv/592093137-25326125893747859-4447695842288716506-n-jpg-nc-cat-110-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-F7.jpg";

    const template = await loadImage(templateURL);
    const avatar = await loadImage(avatarURL);

    // ---- 3. Créer la zone de dessin ----
    const canvas = createCanvas(750, 1050);
    const ctx = canvas.getContext("2d");

    // ---- 4. Dessiner le template ----
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // ---- 5. Dessiner la photo de profil ----
    ctx.drawImage(avatar, 140, 240, 470, 470);

    // ---- 6. Ajouter Nom + Prime ----
    ctx.font = "bold 50px serif";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    // Nom
    ctx.fillText(user.name, canvas.width / 2, 780);

    // Prime
    ctx.font = "bold 45px serif";
    ctx.fillText(`${user.bounty} Berries`, canvas.width / 2, 880);

    // ---- 7. Sauvegarder l’image ----
    const outputPath = path.join(__dirname, "wanted_final.png");
    fs.writeFileSync(outputPath, canvas.toBuffer());

    // ---- 8. Envoyer au bot Messenger ----
    await sendMessage(
      senderId,
      {
        attachment: {
          type: "image",
          payload: {
            url: `file://${outputPath}`
          }
        }
      },
      pageAccessToken
    );

    // Supprimer l’image après envoi
    setTimeout(() => fs.unlinkSync(outputPath), 3000);

  } catch (err) {
    console.error(err);
    await sendMessage(senderId, { text: "❌ Impossible de générer le WANTED." }, pageAccessToken);
  }
};
