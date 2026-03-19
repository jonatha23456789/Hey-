const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'autoalldl',
  description: 'Auto download videos from links (multi API)',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event) {
    try {
      const messageText = event?.message?.text;
      if (!messageText) return;

      // 🔹 Extract URL
      const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      const videoUrl = urlMatch[0];

      let videoDirectUrl = null;
      let title = "Video";
      let thumbnail = null;

      // =========================
      // 🔥 API 1 (xnil6x)
      // =========================
      try {
        const api1 = `https://xnil6x-api-7io2.onrender.com/download/alldl?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(api1, { timeout: 20000 });

        if (data?.success && data?.data?.status) {
          videoDirectUrl = data.data.url;
          title = data.data.title || title;
          thumbnail = data.data.thumbnail;
        }
      } catch (e) {
        console.log("API 1 failed, switching...");
      }

      // =========================
      // 🔥 API 2 (smfahim)
      // =========================
      if (!videoDirectUrl) {
        try {
          const api2 = `https://smfahim.xyz/download/all/v14?url=${encodeURIComponent(videoUrl)}`;
          const { data } = await axios.get(api2, { timeout: 20000 });

          if (data?.success && data?.result) {
            title = data.result.title || title;
            thumbnail = data.result.imageUrl;

            // 🔹 prendre meilleure qualité mp4
            const medias = data.result.medias || [];

            const video = medias.find(m => m.format?.includes('mp4'));

            if (video) {
              videoDirectUrl = video.url;
            }
          }
        } catch (e) {
          console.log("API 2 failed");
        }
      }

      // ❌ si aucune API marche
      if (!videoDirectUrl) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to download video from all APIs.' },
          pageAccessToken
        );
      }

      // =========================
      // ✅ ENVOI
      // =========================

      await sendMessage(
        senderId,
        {
          text: `✅ Video Detected\n🎞 Title: ${title}\n⬇ Sending video...`
        },
        pageAccessToken
      );

      // thumbnail
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

      // video
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
