const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Mémoire des choix par utilisateur
global.videoChoice = global.videoChoice || {};

module.exports = {
  name: 'video',
  description: 'Search YouTube videos and select by reply number',
  usage: '-video <name>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '❌ Please provide a video name.' },
        pageAccessToken
      );
    }

    const query = args.join(' ');

    try {
      // 🔍 NOUVELLE API
      const res = await axios.get(
        'https://api.nekolabs.web.id/dsc/youtube/search',
        { params: { q: query } }
      );

      const videos = res.data?.result?.slice(0, 5);

      if (!videos || videos.length === 0) {
        return sendMessage(
          senderId,
          { text: '❌ No videos found.' },
          pageAccessToken
        );
      }

      // Sauvegarde pour le reply
      global.videoChoice[senderId] = videos;

      const list = videos
        .map(
          (v, i) =>
            `${i + 1}. 🎬 ${v.title}\n   ⏱ ${v.duration} | 📺 ${v.channel}`
        )
        .join('\n\n');

      await sendMessage(
        senderId,
        {
          text:
`🎥 **Videos found**

${list}

🔁 Reply with the number (1-${videos.length})`
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('Video search error:', err.message);
      sendMessage(
        senderId,
        { text: '❌ Error fetching videos.' },
        pageAccessToken
      );
    }
  },

  // 🔁 Gestion du reply avec numéro
  async handleChoice(senderId, messageText, pageAccessToken) {
    const videos = global.videoChoice[senderId];
    if (!videos) return false;

    const index = parseInt(messageText.trim(), 10) - 1;

    if (isNaN(index) || index < 0 || index >= videos.length) {
      return false;
    }

    const video = videos[index];
    delete global.videoChoice[senderId];

    await sendMessage(
      senderId,
      {
        text:
`✅ **Video selected**

🎬 Title: ${video.title}
📺 Channel: ${video.channel}
⏱ Duration: ${video.duration}

🔗 Watch / Download:
${video.url}`
      },
      pageAccessToken
    );

    return true;
  }
};
