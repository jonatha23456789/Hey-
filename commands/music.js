const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'music',
  description: 'Searches YouTube and sends MP3 or MP4 based on your choice',
  usage: '-music <song name>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event, sendMessage, imageCache) {
    if (!args.length) return sendMessage(senderId, { text: '❌ Please provide a song name.' }, pageAccessToken);

    const query = encodeURIComponent(args.join(' '));
    const apiUrl = `https://api.nekolabs.web.id/discovery/youtube/search?q=${query}`;

    try {
      const { data } = await axios.get(apiUrl);

      if (!data.success || !data.result || data.result.length === 0) {
        return sendMessage(senderId, { text: '❌ No results found.' }, pageAccessToken);
      }

      const video = data.result[0]; // premier résultat

      // Envoyer les infos et demander choix MP3 ou MP4
      await sendMessage(senderId, {
        text: `🎵 *YouTube Music Result*\nTitle: ${video.title}\nChannel: ${video.channel}\nDuration: ${video.duration}\n\nRépondez par :\n- \`mp3\` pour le son\n- \`mp4\` pour la vidéo`
      }, pageAccessToken);

      // Stocker temporairement le lien et l'ID pour le suivi du choix
      global.musicChoice = global.musicChoice || {};
      global.musicChoice[senderId] = video.url;

    } catch (error) {
      console.error('Music Search Error:', error.message || error);
      await sendMessage(senderId, { text: '❌ An error occurred while searching for music.' }, pageAccessToken);
    }
  },

  async handleChoice(senderId, text, pageAccessToken) {
    const videoUrl = global.musicChoice?.[senderId];
    if (!videoUrl) return false;

    const choice = text.toLowerCase();
    if (!['mp3', 'mp4'].includes(choice)) return false;

    try {
      let downloadUrl = '';

      if (choice === 'mp3') {
        const { data } = await axios.get(`https://api.nekolabs.web.id/youtube/audio?url=${encodeURIComponent(videoUrl)}`);
        downloadUrl = data.result?.url;
      } else if (choice === 'mp4') {
        const { data } = await axios.get(`https://api.nekolabs.web.id/youtube/video?url=${encodeURIComponent(videoUrl)}`);
        downloadUrl = data.result?.url;
      }

      if (!downloadUrl) {
        return sendMessage(senderId, { text: '❌ Failed to fetch download link.' }, pageAccessToken);
      }

      const type = choice === 'mp3' ? 'audio' : 'video';
      await sendMessage(senderId, { attachment: { type, payload: { url: downloadUrl } } }, pageAccessToken);

      delete global.musicChoice[senderId];
      return true;

    } catch (err) {
      console.error('Music Download Error:', err.message || err);
      await sendMessage(senderId, { text: '❌ Error downloading the file.' }, pageAccessToken);
      return true;
    }
  }
};
