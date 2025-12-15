const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

global.videoChoice = global.videoChoice || {};

module.exports = {
  name: 'video',
  description: 'Search YouTube videos and send download link',
  usage: '-video <name>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '❌ Please provide a video name.' }, pageAccessToken);
    }

    const query = args.join(' ');

    try {
      const res = await axios.get(
        `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`
      );

      const videos = res.data?.result?.slice(0, 5);
      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: '❌ No videos found.' }, pageAccessToken);
      }

      global.videoChoice[senderId] = videos;

      const list = videos.map((v, i) =>
        `${i + 1}. ${v.title} (${v.duration}) - ${v.channel}`
      ).join('\n');

      await sendMessage(senderId, {
        text:
`🎬 Videos found:\n
${list}

Reply with the number`
      }, pageAccessToken);

    } catch (err) {
      console.error(err);
      sendMessage(senderId, { text: '❌ Error fetching videos.' }, pageAccessToken);
    }
  },

  async handleChoice(senderId, messageText, pageAccessToken) {
    if (!global.videoChoice[senderId]) return false;

    const index = parseInt(messageText.trim(), 10) - 1;
    const videos = global.videoChoice[senderId];

    if (isNaN(index) || index < 0 || index >= videos.length) return false;

    const video = videos[index];
    delete global.videoChoice[senderId];

    try {
      const res = await axios.get(
        `https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}`
      );

      const link = res.data?.result?.url || res.data?.result;

      if (!link) {
        return sendMessage(senderId, { text: '❌ Video link not available.' }, pageAccessToken);
      }

      await sendMessage(senderId, {
        text:
`✅ Video ready!

🎬 ${video.title}
⏱ ${video.duration}
📺 ${video.channel}

⬇️ Download link:
${link}`
      }, pageAccessToken);

      return true;

    } catch (err) {
      console.error(err);
      sendMessage(senderId, { text: '❌ Error while fetching video link.' }, pageAccessToken);
      return true;
    }
  }
};
