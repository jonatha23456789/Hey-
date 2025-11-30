const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'wanted',
  description: 'Affiche un avis WANTED basé sur le profil utilisateur.',
  usage: '-wanted',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    try {

      // 1. Info FB : nom + amis
      const fbURL = `https://graph.facebook.com/${senderId}?fields=name,friends.limit(0).summary(true)&access_token=${pageAccessToken}`;
      const user = await axios.get(fbURL);
      const name = user.data.name || "Unknown";
      const count = user.data.friends?.summary?.total_count || 0;

      // 2. Calcul des pièces
      let coins = 10000;
      if (count >= 100000) coins = 100_000_000;
      else if (count >= 1000) coins = 1_000_000;
      else if (count >= 100) coins = 100_000;

      // 3. Image Wanted (ta photo)
      const wantedFrame = "https://i.ibb.co/ZR3Lf5DL/346147964-1299332011011986-1352940821887630970-n-jpg-nc-cat-105-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-HNV.jpg";

      // 4. Photo de profil FB
      const pfp = `https://graph.facebook.com/${senderId}/picture?width=512&height=512`;

      // 5. Envoi sous forme de carousel (100% compatible FB)
      await sendMessage(senderId, {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: `WANTED: ${name}`,
                image_url: wantedFrame,
                subtitle: `Prime : ${coins.toLocaleString()} pièces`,
                buttons: [
                  {
                    type: "web_url",
                    url: pfp,
                    title: "Voir la photo du criminel"
                  }
                ]
              }
            ]
          }
        }
      }, pageAccessToken);

    } catch (err) {
      console.error("Wanted Error:", err.message);
      return sendMessage(senderId, { text: "❌ Impossible d'afficher le WANTED." }, pageAccessToken);
    }
  }
};
