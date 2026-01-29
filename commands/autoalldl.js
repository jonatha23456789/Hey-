const axios = require('axios');

module.exports = {
  name: 'autoalldl',
  description: 'Detect and auto-download videos from shared links',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {
      const messageText = event?.message?.text;
      if (!messageText) return;

      // 🔹 Extract URL
      const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      const videoUrl = urlMatch[0];

      // 🔹 Call NEW API
      const apiUrl = `https://rynekoo-api.hf.space/downloader/aio/v3?url=${encodeURIComponent(videoUrl)}`;
      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      if (!data?.success || !data?.result?.medias?.length) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to fetch downloadable video.' },
          pageAccessToken
        );
      }

      const { medias, source, title } = data.result;

      // 🔹 Pick BEST quality (HD > SD)
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
`✅ Video detected
📌 Platform: ${source}
🎞️ Title: ${title || 'Unknown'}
🎚️ Quality: ${bestMedia.quality?.toUpperCase() || 'UNKNOWN'}
⬇ Sending video...`
        },
        pageAccessToken
      );

      // 🔹 Send video directly
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'video',
            payload: {
              url: bestMedia.url
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
