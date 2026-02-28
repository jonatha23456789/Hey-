const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'autoalldl',
  description: 'Detect and auto-download Facebook videos from shared links',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event) {
    try {
      const messageText = event?.message?.text;
      if (!messageText) return;

      // 🔹 Extract URL
      const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      const videoUrl = urlMatch[0];

      // 🔹 Call NEW API
      const apiUrl = `https://azadx69x-all-apis-top.vercel.app/api/alldl?url=${encodeURIComponent(videoUrl)}`;

      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to fetch video data from API.' },
          pageAccessToken
        );
      }

      const { result } = data;
      const { title, thumbnail, medias, source } = result;

      // 🔹 Choisir la meilleure qualité (HD > SD)
      const bestMedia =
        medias.find(m => m.quality === 'hd' && m.videoAvailable) ||
        medias.find(m => m.videoAvailable);

      if (!bestMedia?.url) {
        return sendMessage(
          senderId,
          { text: '❌ No playable video found.' },
          pageAccessToken
        );
      }

      // 🔹 Info message
      await sendMessage(
        senderId,
        {
          text:
`✅ Facebook Video Detected
🎞 Title: ${title || 'Unknown'}
🎚 Quality: ${bestMedia.quality?.toUpperCase() || 'UNKNOWN'}
📡 Source: ${source || 'Facebook'}
⬇ Sending video...`
        },
        pageAccessToken
      );

      // 🔹 Optional thumbnail preview
      if (thumbnail) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: { url: thumbnail }
            }
          },
          pageAccessToken
        );
      }

      // 🔹 Send video
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'video',
            payload: {
              url: bestMedia.url,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('autoalldl error:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while downloading Facebook video.' },
        pageAccessToken
      );
    }
  }
};
