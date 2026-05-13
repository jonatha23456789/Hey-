const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'autoalldl',
  description: 'Auto download videos from links',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {
    try {
      const messageText = event?.message?.text;
      if (!messageText) return;

      // 🔹 Extract URL
      const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      const videoUrl = urlMatch[0];

      // 🔥 NEW API
      const apiUrl =
        `https://azadx69x-all-apis-top.vercel.app/api/chudi?url=${encodeURIComponent(videoUrl)}`;

      const { data } = await axios.get(apiUrl, {
        timeout: 30000
      });

      // ❌ API failed
      if (!data?.success || !data?.result) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to fetch video.' },
          pageAccessToken
        );
      }

      const directVideo = data.result;
      const source = data.source || "unknown";

      // ✅ info message
      await sendMessage(
        senderId,
        {
          text:
`✅ Video Detected

📺 Source: ${source}
⬇ Sending video...`
        },
        pageAccessToken
      );

      // ✅ SEND VIDEO DIRECTLY
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'video',
            payload: {
              url: directVideo,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error(
        'autoalldl error:',
        err.response?.data || err.message
      );

      await sendMessage(
        senderId,
        {
          text:
'❌ Error while downloading video.\nThe video may be too large for Messenger.'
        },
        pageAccessToken
      );
    }
  }
};
