const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'wanted',
  description: 'Affiche une affiche WANTED avec le profil de l’utilisateur.',
  usage: '-wanted',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    try {
      // 1. Récupérer les infos du profil utilisateur
      const userInfoUrl = `https://graph.facebook.com/${senderId}?fields=name,friends.limit(0).summary(true)&access_token=${pageAccessToken}`;
      const userInfo = await axios.get(userInfoUrl);
      
      const userName = userInfo.data.name || "Unknown";
      const friendCount = userInfo.data.friends?.summary?.total_count || 0;

      // 2. Calcul des pièces selon le nombre d'amis/followers
      let coins = 0;
      if (friendCount >= 100000) coins = 100_000_000;
      else if (friendCount >= 1000) coins = 1_000_000;
      else if (friendCount >= 100) coins = 100_000;
      else coins = 10_000; // min reward

      // 3. Photo de profil de l’utilisateur
      const profilePic = `https://graph.facebook.com/${senderId}/picture?width=512&height=512`;

      // 4. Image Wanted (API fournie)
      const wantedImage = "https://i.ibb.co/ZR3Lf5DL/346147964-1299332011011986-1352940821887630970-n-jpg-nc-cat-105-ccb-1-7-nc-sid-fc17b8-nc-eui2-Ae-HNV.jpg";

      // 5. Envoi du message final sous forme de Carousel (compat FB)
      await sendMessage(senderId, {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: `WANTED: ${userName}`,
                image_url: profilePic,
                subtitle: `Prime : ${coins.toLocaleString()} pièces`,
                default_action: {
                  type: "web_url",
                  url: wantedImage
                },
                buttons: [
                  {
                    type: "web_url",
                    url: wantedImage,
                    title: "Voir l'affiche"
                  }
                ]
              }
            ]
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error("Erreur CMD Wanted :", error.message);
      await sendMessage(senderId, { text: "❌ Impossible de générer l'affiche WANTED." }, pageAccessToken);
    }
  }
};
