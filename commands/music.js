const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

const musicChoice = {}; // pour stocker le choix mp3/mp4 par utilisateur

module.exports = {
  name: 'music',
  description: 'Searches for songs on YouTube and provides mp3/mp4 download links',
  usage: '-music <song name>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '❌ Please provide a song name.' }, pageAccessToken);
    }

    // On demande à l'utilisateur si MP3 ou MP4
    musicChoice[senderId] = true;
    await sendMessage(senderId, {
      text: '🎵 Do you want to download the song as MP3 or MP4? Reply with `mp3` or `mp4`.'
    }, pageAccessToken);

    // Stocke le titre recherché pour le choix
    musicChoice[`${senderId}_query`] = args.join(' ');
  },

  // Fonction pour gérer le choix mp3/mp4
  async handleChoice(senderId, messageText, pageAccessToken) {
    if (!musicChoice[senderId]) return false;

    const format = messageText.toLowerCase();
    if (!['mp3', 'mp4'].includes(format)) return false;

    const query = musicChoice[`${senderId}_query`];
    delete musicChoice[senderId];
    delete musicChoice[`${senderId}_query`];

    try {
      // Cherche la vidéo sur YouTube via l'API Nekolabs
      const searchRes = await axios.get(`https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`);
      const video = searchRes.data.result?.[0];
      if (!video) {
        await sendMessage(senderId, { text: '❌ No video found for this query.' }, pageAccessToken);
        return true;
      }

      // Demande de téléchargement via l'API Nekolabs
      const downloadRes = await axios.get(`https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=${format}`);
      const fileUrl = downloadRes.data.result;
      if (!fileUrl) {
        await sendMessage(senderId, { text: '❌ Error fetching the download link.' }, pageAccessToken);
        return true;
      }

      // Téléchargement temporaire
      const tmpFile = path.join(__dirname, `tmp_${Date.now()}.${format}`);
      const fileData = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(tmpFile, fileData.data);

      // Upload sur Messenger
      const formData = new FormData();
      formData.append('message', JSON.stringify({
        attachment: { type: format === 'mp3' ? 'audio' : 'video', payload: { is_reusable: true } }
      }));
      formData.append('filedata', fs.createReadStream(tmpFile));

      const uploadRes = await axios.post(
        `https://graph.facebook.com/v22.0/me/message_attachments?access_token=${pageAccessToken}`,
        formData,
        { headers: formData.getHeaders() }
      );

      const attachmentId = uploadRes.data.attachment_id;

      await axios.post(
        `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: { type: format === 'mp3' ? 'audio' : 'video', payload: { attachment_id: attachmentId } }
          }
        }
      );

      fs.unlinkSync(tmpFile);

    } catch (err) {
      console.error('Music download error:', err.message || err);
      await sendMessage(senderId, { text: '❌ Error downloading or sending the file.' }, pageAccessToken);
    }

    return true;
  }
};
