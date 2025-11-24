const axios = require('axios');

module.exports = {
  name: 'aniquotes',
  description: 'Fetch a random anime quote with character image.',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    await sendMessage(senderId, { text: "⚙ Fetching a random anime quote..." }, pageAccessToken);

    try {
      // === 1) API DE L’UTILISATEUR ===
      const res = await axios.get("https://api.animechan.io/v1/quotes/random");
      const data = res.data.data;

      const quote = data.content;
      const anime = data.anime.name;
      const character = data.character.name;

      // === 2) RÉCUPÉRATION DE L’IMAGE ===
      let imageURL = null;

      try {
        const imgRes = await axios.get(
          `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(character)}&limit=1`
        );

        if (imgRes.data.data && imgRes.data.data.length > 0) {
          imageURL = imgRes.data.data[0].images.jpg.image_url;
        }
      } catch (err) {
        console.log("Image fetch error:", err.message);
      }

      // === 3) MESSAGE TEXTE ===
      await sendMessage(
        senderId,
        {
          text:
            `📝 *Anime Quote*\n\n` +
            `💬 "${quote}"\n\n` +
            `👤 *${character}*\n` +
            `📺 Anime : *${anime}*`
        },
        pageAccessToken
      );

      // === 4) MESSAGE IMAGE ===
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
          { text: "⚠ Aucun image trouvée pour ce personnage." },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error(error);
      await sendMessage(
        senderId,
        { text: `❌ Error: ${error.message}` },
        pageAccessToken
      );
    }
  }
};
