const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

// mémoire des résultats
global.videoChoice = global.videoChoice || {};

module.exports = {
  name: "video",
  description: "Search YouTube videos and select by reply number",
  usage: "-video <name>",
  author: "coffee",

  async execute(senderId, args, pageAccessToken) {

    if (!args.length) {
      return sendMessage(
        senderId,
        { text: "❌ Please provide a video name." },
        pageAccessToken
      );
    }

    const query = args.join(" ");

    try {

      const api =
        `https://christus-api.vercel.app/search/youtubeSearch?q=${encodeURIComponent(query)}&count=5`;

      const { data } = await axios.get(api);

      const videos = data?.result;

      if (!data.status || !videos || videos.length === 0) {
        return sendMessage(
          senderId,
          { text: "❌ No videos found." },
          pageAccessToken
        );
      }

      // sauvegarde pour reply
      global.videoChoice[senderId] = videos;

      const list = videos
        .map(
          (v, i) =>
`${i + 1}. 🎬 ${v.title}
   ⏱ ${v.timestamp}
   📺 ${v.author}
   👀 ${v.views.toLocaleString()} views`
        )
        .join("\n\n");

      await sendMessage(
        senderId,
        {
          text:
`🎥 Videos Found

${list}

🔁 Reply with a number (1-${videos.length})`
        },
        pageAccessToken
      );

    } catch (err) {

      console.error(
        "Video Search Error:",
        err.response?.data || err.message
      );

      sendMessage(
        senderId,
        { text: "❌ Error fetching videos." },
        pageAccessToken
      );
    }
  },

  // gestion du reply
  async handleChoice(senderId, messageText, pageAccessToken) {

    const videos = global.videoChoice[senderId];
    if (!videos) return false;

    const index = parseInt(messageText.trim()) - 1;

    if (isNaN(index) || index < 0 || index >= videos.length) {
      return false;
    }

    const video = videos[index];
    delete global.videoChoice[senderId];

    await sendMessage(
      senderId,
      {
        text:
`✅ Video Selected

🎬 Title: ${video.title}
📺 Channel: ${video.author}
⏱ Duration: ${video.timestamp}
👀 Views: ${video.views.toLocaleString()}

🔗 Watch:
${video.url}`
      },
      pageAccessToken
    );

    // thumbnail preview
    if (video.thumbnail) {
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: { url: video.thumbnail }
          }
        },
        pageAccessToken
      );
    }

    return true;
  }
};
