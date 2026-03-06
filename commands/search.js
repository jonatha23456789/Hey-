const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "search",
  description: "Generate WANTED posters",
  usage: "-wantedposter <uid> <name> <reward>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {

    if (args.length < 3) {
      return sendMessage(
        senderId,
        {
          text:
`⚠️ Usage:
-wantedposter <uid> <name> <reward>

Example:
-wantedposter 1000923456 Luffy 500000000`
        },
        pageAccessToken
      );
    }

    const uid = args[0];
    const reward = args[args.length - 1];
    const name = args.slice(1, -1).join(" ");

    const api =
`https://betadash-api-swordslush-production.up.railway.app/wanted-poster?userid=${encodeURIComponent(uid)}&name=${encodeURIComponent(name)}&reward=${encodeURIComponent(reward)}`;

    try {

      await sendMessage(
        senderId,
        { text: "🎨 Generating WANTED poster..." },
        pageAccessToken
      );

      const { data } = await axios.get(api, { timeout: 60000 });

      const imageUrl = data?.results?.url;

      if (!imageUrl) {
        return sendMessage(
          senderId,
          { text: "❌ API failed to generate poster." },
          pageAccessToken
        );
      }

      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: { url: imageUrl }
          }
        },
        pageAccessToken
      );

      await sendMessage(
        senderId,
        {
          text:
`🏴‍☠️ WANTED POSTER

👤 Name: ${name}
💰 Reward: ${reward}
🆔 UID: ${uid}`
        },
        pageAccessToken
      );

    } catch (err) {

      console.error(
        "WantedPoster Error:",
        err.response?.data || err.message
      );

      await sendMessage(
        senderId,
        { text: "❌ Error generating WANTED poster." },
        pageAccessToken
      );
    }
  }
};
