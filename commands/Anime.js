const axios = require("axios");
const fs = require("fs");
const { sendMessage } = require("../handles/sendMessage");

const token = fs.readFileSync("token.txt", "utf8");

module.exports = {
  name: "anime",
  description: "Search for anime details by name",
  author: "Hk",

  async execute(senderId, args) {
    const pageAccessToken = token;
    const query = args.join(" ").trim();

    if (!query) {
      return await sendMessage(
        senderId,
        { text: "❗ Please provide an anime name.\nExample: anime Bleach" },
        pageAccessToken
      );
    }

    try {
      await sendMessage(senderId, { text: "🔍 Searching anime details..." }, pageAccessToken);

      const apiUrl = `https://kaiz-apis.gleeze.com/api/mal?title=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.title) {
        return await sendMessage(
          senderId,
          { text: `❌ No details found for "${query}".` },
          pageAccessToken
        );
      }

      const infoMsg = `🎬 *${data.title}* (${data.japanese || "N/A"})\n\n` +
        `📺 *Type:* ${data.type || "N/A"}\n` +
        `📅 *Status:* ${data.status || "N/A"}\n` +
        `⭐ *Score:* ${data.score || "N/A"} (${data.scoreStats || "no stats"})\n` +
        `👥 *Popularity:* ${data.popularity || "N/A"}\n` +
        `🍿 *Aired:* ${data.aired || "N/A"}\n` +
        `🎙️ *Studios:* ${data.studios || "N/A"}\n` +
        `📖 *Genres:* ${data.genres || "N/A"}\n\n` +
        `📝 *Synopsis:*\n${data.description || "No description available."}\n\n` +
        `🔗 *More info:* ${data.url || "N/A"}`;

      // Send anime image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              url: data.picture || "https://i.imgur.com/7s8wWjA.png",
              is_reusable: true,
            },
          },
        },
        pageAccessToken
      );

      // Send details text
      await sendMessage(senderId, { text: infoMsg }, pageAccessToken);
    } catch (error) {
      console.error("❌ Error fetching anime:", error.message);
      await sendMessage(
        senderId,
        { text: "⚠️ An error occurred while fetching anime details. Please try again later." },
        pageAccessToken
      );
    }
  },
};
