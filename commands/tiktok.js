const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'tiktok',
  description: 'Search and send a TikTok video by keyword',
  author: 'Hk',
  usage: '-tiktok <keyword>',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ').trim();
    if (!query) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a search keyword.\nExample: -tiktok Bleach' },
        pageAccessToken
      );
    }

    try {
      await sendMessage(senderId, { text: '🔎 Searching TikTok video...' }, pageAccessToken);

      const apiUrl = `https://arychauhann.onrender.com/api/tiktoksearch?q=${encodeURIComponent(query)}&count=1`;
      const { data } = await axios.get(apiUrl);

      if (data.code !== 0 || !data.data?.videos?.length) {
        return sendMessage(
          senderId,
          { text: '❌ No TikTok video found for this search.' },
          pageAccessToken
        );
      }

      const video = data.data.videos[0];
      const author = video.author?.nickname || 'Unknown';
      const username = video.author?.unique_id || 'N/A';
      const title = video.title || 'Untitled video';
      const playCount = video.play_count?.toLocaleString() || '0';
      const likes = video.digg_count?.toLocaleString() || '0';
      const comments = video.comment_count?.toLocaleString() || '0';
      const shares = video.share_count?.toLocaleString() || '0';
      const cover = video.cover;
      const videoUrl = video.play;

      // 📝 Texte d’informations d’abord
      const caption = `🎬 *TikTok Video Found!*\n\n🎥 *Title:* ${title}\n👤 *Creator:* ${author} (@${username})\n▶️ *Plays:* ${playCount}\n❤️ *Likes:* ${likes}\n💬 *Comments:* ${comments}\n🔁 *Shares:* ${shares}\n\n🎵 *Sound:* ${video.music_info?.title || 'N/A'} - ${video.music_info?.author || ''}`;

      await sendMessage(senderId, { text: caption }, pageAccessToken);

      // 🖼️ Envoi de la couverture
      if (cover) {
        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: cover } },
        }, pageAccessToken);
      }

      // 🎞️ Envoi de la vidéo
      if (videoUrl) {
        await sendMessage(senderId, {
          attachment: { type: 'video', payload: { url: videoUrl } },
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('❌ TikTok Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '⚠️ An error occurred while fetching TikTok video.' },
        pageAccessToken
      );
    }
  },
};
