const axios = require('axios');

module.exports = {
  name: 'aniquotes',
  description: 'Fetch a random anime quote with character image',
  author: 'kelvin ',

  async execute(senderId, args, pageAccessToken, sendMessage) {

    // Message de chargement
    await sendMessage(senderId, { text: "⚙ 𝗙𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗮 𝗿𝗮𝗻𝗱𝗼𝗺 𝗮𝗻𝗶𝗺𝗲 𝗾𝘂𝗼𝘁𝗲..." }, pageAccessToken);

    try {
      // ---------------------------
      // 1) Nouvelle API pour la quote
      // ---------------------------
      const quoteRes = await axios.get("https://animechan.xyz/api/random");
      const data = quoteRes.data;

      const anime = data.anime;
      const character = data.character;
      const quote = data.quote;

      // ---------------------------
      // 2) API pour récupérer l’image du personnage
      // ---------------------------
      let imageURL = null;

      try {
        const imgRes = await axios.get(
          `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(character)}&limit=1`
        );

        if (imgRes.data.data && imgRes.data.data.length > 0) {
          imageURL = imgRes.data.data[0].images.jpg.image_url;
        }
      } catch (imgErr) {
        console.log("❌ Impossible de récupérer l'image du personnage:", imgErr.message);
      }

      // ---------------------------
      // 3) Envoi du message + image
      // ---------------------------
      await sendMessage(
        senderId,
        {
          text: `📝 𝗔𝗻𝗶𝗺𝗲 𝗤𝘂𝗼𝘁𝗲\n\n"🌟 ${quote}"\n\n👤 ${character}\n📺 Anime : ${anime}`
        },
        pageAccessToken
      );

      if (imageURL) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: "image",
              payload: { url: imageURL }
            }
          },
          pageAccessToken
        );
      } else {
        await sendMessage(
          senderId,
          { text: "⚠️ Aucune image disponible pour ce personnage." },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error(error);
      sendMessage(
        senderId,
        { text: `❌ Une erreur est survenue: ${error.message}` },
        pageAccessToken
      );
    }
  }
};
