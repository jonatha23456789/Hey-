const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Mémoire globale pour le choix utilisateur
global.videoChoice = global.videoChoice || {};

module.exports = {
  name: 'video',
  description: 'Search YouTube videos and choose one to get the video link',
  usage: '-video <search>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, {
        text: '❌ Please provide a search term.\nExample: -video friendzone'
      }, pageAccessToken);
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

      // Stocker le choix utilisateur
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
      console.error('VIDEO SEARCH ERROR:', err.message);
      await sendMessage(senderId, { text: '❌ Error fetching videos.' }, pageAccessToken);
    }
  },

  // ===============================
  // GESTION DU CHOIX (1, 2, 3...)
  // ===============================
  async handleChoice(senderId, messageText, pageAccessToken) {
    const videos = global.videoChoice?.[senderId];
    if (!videos) return false;

    const index = parseInt(messageText.trim(), 10) - 1;
    if (isNaN(index) || index < 0 || index >= videos.length) return false;

    const video = videos[index];
    delete global.videoChoice[senderId];

    try {
      const res = await axios.get(
        `https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=mp4`
      );

      // ✅ parsing SAFE
      let videoUrl = null;
      if (typeof res.data?.result === 'string') {
        videoUrl = res.data.result;
      } else if (res.data?.result?.url) {
        videoUrl = res.data.result.url;
      }

      if (!videoUrl) {
        console.log('API RESPONSE:', res.data);
        return sendMessage(senderId, {
          text: '❌ Unable to retrieve video link.'
        }, pageAccessToken);
      }

      // Thumbnail
      if (video.cover) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: video.cover }
          }
        }, pageAccessToken);
      }

      // Message final
      await sendMessage(senderId, {
        text:
`🎬 ${video.title}
⏱ Duration: ${video.duration}
📺 Channel: ${video.channel}

🔗 Video link:
${videoUrl}`
      }, pageAccessToken);

      return true;

    } catch (err) {
      console.error('VIDEO HANDLE ERROR:', err?.response?.data || err.message);
      await sendMessage(senderId, {
        text: '❌ Error while fetching video link.'
      }, pageAccessToken);
      return true;
    }
  }
};
