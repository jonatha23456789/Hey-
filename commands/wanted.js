const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

// Conversion followers/amies → prime
function formatCoins(followers) {
  if (followers >= 100000) return "100,000,000 pièces";
  if (followers >= 1000) return "1,000,000 pièces";
  if (followers >= 100) return "100,000 pièces";
  return "10,000 pièces";
}

module.exports = {
  name: "wanted",
  description: "Créer un poster WANTED pour un utilisateur.",
  usage: "-wanted",
  author: "kelvin",

  async execute(senderId, args, pageAccessToken) {
    try {

      // 1️⃣ Récupérer les infos de l’utilisateur depuis Facebook Graph API
      const userInfo = await axios.get(
        `https://graph.facebook.com/${senderId}`,
        {
          params: {
            fields: "name,friends.limit(0).summary(true),picture.type(large)",
            access_token: pageAccessToken,
          }
        }
      );

      const name = userInfo.data.name;
      const followers =
        userInfo.data.friends?.summary?.total_count || 0;
      const photo = userInfo.data.picture?.data?.url;

      const coins = formatCoins(followers);

      // 2️⃣ Template Wanted (image fixe)
      const wantedTemplate =
        "https://i.ibb.co/ZR3Lf5DL/346147964-1299332011011986-1352940821887630970-n-jpg-nc-cat-105-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-HNV.jpg";

      // 3️⃣ Envoi du poster WANTED
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: `🎯 WANTED : ${name}`,
                  image_url: wantedTemplate,
                  subtitle: `Prime : ${coins}\nFollowers : ${followers}`,
                  buttons: [
                    {
                      type: "web_url",
                      url: photo,
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
      console.error("WANTED ERROR:", err.response?.data || err);

      await sendMessage(
        senderId,
        { text: "❌ Impossible de générer le poster WANTED." },
        pageAccessToken
      );
    }
  }
};
