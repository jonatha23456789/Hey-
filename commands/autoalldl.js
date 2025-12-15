const axios = require('axios');

module.exports = {
  name: 'autoalldl',
  description: 'Detect and auto-download videos from shared links',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event, sendMessage) {
    try {
      const messageText = event?.message?.text;
      if (!messageText) return;

      // 🔹 Extraire le lien
      const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      const videoUrl = urlMatch[0];

      // 🔹 Appel API
      const apiUrl = `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(videoUrl)}`;
      const res = await axios.get(apiUrl);

      if (!res.data?.status || !res.data?.data?.videoUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to fetch downloadable video.' },
          pageAccessToken
        );
      }

      const { videoUrl: downloadUrl, platform } = res.data.data;

      // 🔹 Message info
      await sendMessage(
        senderId,
        {
          text: `✅ Video detected\n📌 Platform: ${platform}\n⬇ Sending video...`
        },
        pageAccessToken
      );

      // 🔹 Envoi DIRECT de la vidéo (MEILLEURE MÉTHODE)
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'video',
            payload: {
              url: downloadUrl
            }
          }
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('autoalldl error:', err.message || err);
      await sendMessage(
        senderId,
        { text: '❌ Error while downloading video.' },
        pageAccessToken
      );
    }
  }
};
