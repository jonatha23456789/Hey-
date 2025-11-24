const axios = require('axios');

module.exports = {
  name: 'aniquotes',
  description: 'Fetch a random anime quote with character image',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    await sendMessage(senderId, { text: "⚙ Fetching a random anime quote..." }, pageAccessToken);

    try {
      // 1) Fetch quote
      const quoteRes = await axios.get("https://animechan.xyz/api/random");
      const data = quoteRes.data;

      const anime = data.anime;
      const character = data.character;
      const quote = data.quote;

      // 2) Fetch character image
      let imageURL = null;
      try {
        const imgRes = await axios.get(
          `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(character)}&limit=1`
        );

        if (imgRes.data.data && imgRes.data.data.length > 0) {
          imageURL = imgRes.data.data[0].images.jpg.image_url;
        }
      } catch (imgErr) {
        console.log("Image fetch failed:", imgErr.message);
      }

      // 3) Send text
      await sendMessage(
        senderId,
        {
          text: `📝 Anime Quote\n\n"${quote}"\n\n👤 ${character}\n📺 Anime : ${anime}`
        },
        pageAccessToken
      );

      // 4) Send image
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
          { text: "⚠ Aucune image trouvée pour ce personnage." },
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
