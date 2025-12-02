const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage"); // 👈 chemin corrigé

// FORMATTER LES PIECES
function formatCoins(followers) {
  if (followers >= 100000) return "100,000,000 pièces";
  if (followers >= 1000) return "1,000,000 pièces";
  if (followers >= 100) return "100,000 pièces";
  return "10,000 pièces";
}

module.exports = async (senderId, user, pageAccessToken) => {
  try {

    const wantedTemplate =
      "https://i.ibb.co/ZR3Lf5DL/346147964-1299332011011986-1352940821887630970-n-jpg-nc-cat-105-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-HNV.jpg";

    const coins = formatCoins(user.followers);

    await sendMessage(
      senderId,
      {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: `🎯 WANTED : ${user.name}`,
                image_url: wantedTemplate,
                subtitle: `Prime : ${coins}\nFollowers : ${user.followers}`,
                buttons: [
                  {
                    type: "web_url",
                    url: user.photo,
                    title: "Voir la photo"
                  }
                ]
              }
            ]
          }
        }
      },
      pageAccessToken
    );

  } catch (err) {
    console.error(err);
    await sendMessage(
      senderId,
      { text: "❌ Impossible de générer le poster WANTED." },
      pageAccessToken
    );
  }
};
