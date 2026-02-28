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

      // 🔹 Call NEW API (Railway fbdownv2)
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/fbdownv2?url=${encodeURIComponent(videoUrl)}`;

      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      if (!data?.results) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to fetch video data.' },
          pageAccessToken
        );
      }

      const { title, description, duration, thumbnail, download_links } = data.results;

      const videoLink =
        download_links?.hd ||
        download_links?.sd;

      if (!videoLink) {
        return sendMessage(
          senderId,
          { text: '❌ No downloadable video found.' },
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
⏱ Duration: ${duration || 'Unknown'}
🎚 Quality: ${download_links?.hd ? 'HD' : 'SD'}
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
              url: videoLink,
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
