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

      // 🔹 NEW API
      const apiUrl = `https://xnil6x-api-7io2.onrender.com/download/alldl?url=${encodeURIComponent(videoUrl)}`;

      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      if (!data?.success || !data?.data?.status) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to fetch video data.' },
          pageAccessToken
        );
      }

      const videoData = data.data;
      const title = videoData.title || 'Facebook Video';
      const videoDirectUrl = videoData.url;
      const thumbnail = videoData.thumbnail;

      if (!videoDirectUrl) {
        return sendMessage(
          senderId,
          { text: '❌ No downloadable video found.' },
          pageAccessToken
        );
      }

      // 🔹 Info Message
      await sendMessage(
        senderId,
        {
          text:
`✅ Facebook Video Detected
🎞 Title: ${title}
📡 Platform: ${data.platform || 'Facebook'}
⬇ Sending video...`
        },
        pageAccessToken
      );

      // 🔹 Thumbnail (optional preview)
      if (thumbnail) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: {
                url: thumbnail,
                is_reusable: true
              }
            }
          },
          pageAccessToken
        );
      }

      // 🔹 Send Video
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'video',
            payload: {
              url: videoDirectUrl,
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
        { text: '❌ Error while downloading video.' },
        pageAccessToken
      );
    }
  }
};
