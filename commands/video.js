const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "video",
  description: "Recherche des vidéos YouTube",
  usage: "youtube <mot clé>",
  author: "coffee",

  async execute(senderId, args, token) {
    const query = args.join(" ");
    if (!query) {
      return sendMessage(senderId, {
        text: "❌ | Tu dois entrer un mot clé.\nExemple : youtube zero two"
      }, token);
    }

    const api = `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`;

    try {
      const res = await axios.get(api);
      const data = res.data;

      if (!data.success || !data.result.length) {
        return sendMessage(senderId, { text: "❌ | Aucune vidéo trouvée." }, token);
      }

      // Boucle : envoi chaque vidéo une par une
      for (const video of data.result) {
        await sendMessage(senderId, {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: video.title,
                  subtitle: `${video.channel} | ${video.duration}`,
                  image_url: video.cover,
                  buttons: [
                    {
                      type: "web_url",
                      url: video.url,
                      title: "▶️ Regarder"
                    }
                  ]
                }
              ]
            }
          }
        }, token);
      }

    } catch (error) {
      console.log(error);
      sendMessage(senderId, { text: "❌ | Erreur avec l’API YouTube." }, token);
    }
  }
};
