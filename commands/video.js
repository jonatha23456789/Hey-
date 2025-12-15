const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

global.videoChoice = {};

module.exports = {
  name: 'video',
  description: 'Search YouTube videos and send download link',
  usage: '-video <query>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '❌ Please provide a search query.' }, pageAccessToken);
    }

    const query = args.join(' ');

    try {
      const res = await axios.get(
        `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`
      );

      const videos = res.data.result?.slice(0, 5);
      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: '❌ No videos found.' }, pageAccessToken);
      }

      global.videoChoice[senderId] = videos;

      const list = videos.map(
        (v, i) => `${i + 1}. ${v.title} (${v.duration}) - ${v.channel}`
      ).join('\n');

      await sendMessage(senderId, {
        text:
`🎬 Videos found:\n
${list}

Reply with the number`
      }, pageAccessToken);

    } catch (err) {
      console.error(err);
      await sendMessage(senderId, { text: '❌ Error fetching videos.' }, pageAccessToken);
    }
  },

  async handleChoice(senderId, messageText, pageAccessToken) {
    const videos = global.videoChoice[senderId];
    if (!videos) return false;

    const index = parseInt(messageText, 10) - 1;
    if (isNaN(index) || index < 0 || index >= videos.length) return false;

    const video = videos[index];
    delete global.videoChoice[senderId];

    try {
      const res = await axios.get(
        `https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=mp4`
      );

      const videoUrl = res.data.result;
      if (!videoUrl) {
        return sendMessage(senderId, { text: '❌ Unable to fetch video link.' }, pageAccessToken);
      }

      // 🖼️ Miniature
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: { url: video.cover }
        }
      }, pageAccessToken);

      // 🔗 Lien cliquable
      await sendMessage(senderId, {
        text:
`🎬 *${video.title}*
⏱ Duration: ${video.duration}
📺 Channel: ${video.channel}

🔗 Download / Watch:
${videoUrl}`
      }, pageAccessToken);

    } catch (err) {
      console.error('Video link error:', err.message);
      await sendMessage(senderId, { text: '❌ Error sending video link.' }, pageAccessToken);
    }

    return true;
  }
};
