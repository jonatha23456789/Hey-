const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'video',
  description: 'Send YouTube video in high quality by name',
  usage: '-video <video name>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();
    if (!query) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide the name of the video.\nUsage: -video <video name>' },
        pageAccessToken
      );
    }

    try {
      // 🔍 Step 1: Search YouTube for the first result
      const searchUrl = `https://noobs-api.vercel.app/api/ytsearch?query=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl);

      const video = searchRes.data && searchRes.data.results && searchRes.data.results[0];
      if (!video || !video.url) {
        return sendMessage(senderId, { text: '❌ No video found for your query.' }, pageAccessToken);
      }

      const videoUrl = video.url;

      // 🎬 Step 2: Fetch video download links from your API
      const { data } = await axios.get(`https://arychauhann.onrender.com/api/youtubemp4?url=${encodeURIComponent(videoUrl)}`);

      if (!data || !data.main) {
        return sendMessage(senderId, { text: '❌ Could not get video details. Try again later.' }, pageAccessToken);
      }

      // 🖼️ Step 3: Send thumbnail + details
      const caption = `🎬 *${data.title}*\n👤 Operator: ${data.operator}\n\n📺 *Available Qualities:*`;
      const qualities =
        data.other?.map(q => `• ${q.quality} — [Download Link](${q.link})`).join('\n') || 'No other formats found.';

      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: data.thumbnail }
          },
          text: `${caption}\n\n${qualities}\n\n🎥 *Main Video Link:*\n${data.main}`
        },
        pageAccessToken
      );

      // 📤 Step 4: Send main video
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'video',
            payload: { url: data.main }
          },
          text: `🎥 Now playing: ${data.title}`
        },
        pageAccessToken
      );
    } catch (error) {
      console.error('Video Command Error:', error.message || error);
      sendMessage(senderId, { text: '🚨 Error fetching or sending video. Try again.' }, pageAccessToken);
    }
  }
};
