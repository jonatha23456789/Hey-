const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'autoalldl',
  description: 'Detect and automatically download videos from shared links',
  usage: '-autoalldl <video link>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event) {
    // 1️⃣ Récupérer le lien (soit en argument, soit texte direct)
    const text =
      args.join(' ') ||
      event?.message?.text;

    if (!text) {
      return sendMessage(
        senderId,
        { text: '❌ Please send a video link.' },
        pageAccessToken
      );
    }

    // 2️⃣ Détecter un lien dans le message
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
      return sendMessage(
        senderId,
        { text: '❌ No valid link detected.' },
        pageAccessToken
      );
    }

    const videoUrl = urlMatch[0];

    try {
      // 3️⃣ Appel API alldl
      const res = await axios.get(
        `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(videoUrl)}`
      );

      if (!res.data?.status || !res.data?.data?.videoUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Unable to fetch download link.' },
          pageAccessToken
        );
      }

      const { videoUrl: downloadUrl, platform } = res.data.data;

      // 4️⃣ Envoi du lien (méthode la plus stable)
      await sendMessage(
        senderId,
        {
          text:
`✅ Video detected successfully!

📌 Platform: ${platform}
⬇️ Direct download link:
${downloadUrl}`
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('autoalldl error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Error while downloading the video.' },
        pageAccessToken
      );
    }
  }
};
