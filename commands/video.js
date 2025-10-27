const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'video',
  description: 'Send YouTube video in high quality',
  usage: '-video <YouTube URL>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const url = args.join(' ').trim();
    if (!url) {
      return sendMessage(senderId, { text: '⚠️ Please provide a YouTube link.' }, pageAccessToken);
    }

    try {
      // 🔗 Appel API
      const { data } = await axios.get(`https://arychauhann.onrender.com/api/youtubemp4?url=${encodeURIComponent(url)}`);

      // ✅ Vérification de la réponse
      if (!data || !data.title || !data.main) {
        return sendMessage(senderId, { text: '❌ Could not fetch video details. Try another link.' }, pageAccessToken);
      }

      // 🎬 Envoi des infos de la vidéo
      const caption = `🎵 *${data.title}*\n👤 Operator: ${data.operator}\n\n📺 *Available Qualities:*`;

      // 🔗 Liste des qualités
      const qualities = data.other
        ?.map(q => `• ${q.quality} — [Download Link](${q.link})`)
        .join('\n') || 'No other formats found.';

      // 🖼️ Envoi de la miniature + info
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: { url: data.thumbnail }
        },
        text: `${caption}\n\n${qualities}\n\n🎬 *Main Video Link:*\n${data.main}`
      }, pageAccessToken);

      // 📤 Envoi direct de la vidéo principale
      await sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: { url: data.main }
        },
        text: `🎬 Playing: ${data.title}`
      }, pageAccessToken);

    } catch (error) {
      console.error('Video Command Error:', error.message || error);
      sendMessage(senderId, { text: '🚨 Failed to download or send the video.' }, pageAccessToken);
    }
  }
};
