const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

const musicChoice = {}; // pour stocker le choix et la recherche par utilisateur

module.exports = {
  name: 'music',
  description: 'Searches for songs on YouTube and provides mp3/mp4 download links',
  usage: '-music <song name>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '❌ Please provide a song name.' }, pageAccessToken);
    }

    const query = args.join(' ');

    try {
      // Recherche via l'API Nekolabs
      const res = await axios.get(`https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`);
      const videos = res.data.result?.slice(0, 5);
      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: '❌ No songs found for your query.' }, pageAccessToken);
      }

      // Stocke les vidéos pour l'utilisateur
      musicChoice[senderId] = videos;

      // Formate la liste
      const listText = videos.map((v, i) => 
        `${i + 1}. ${v.title} (${v.duration}) - ${v.channel}`
      ).join('\n');

      await sendMessage(senderId, {
        text: `🎵 Songs found:\n\n${listText}\n\nReply with the number and type: e.g. "1 mp3" or "2 mp4"`
      }, pageAccessToken);

    } catch (err) {
      console.error('Music search error:', err.message || err);
      await sendMessage(senderId, { text: '❌ Error fetching songs.' }, pageAccessToken);
    }
  },

  // Fonction pour gérer le choix mp3/mp4
  async handleChoice(senderId, messageText, pageAccessToken) {
    if (!musicChoice[senderId]) return false;

    const parts = messageText.trim().split(' ');
    if (parts.length !== 2) return false;

    const index = parseInt(parts[0], 10) - 1;
    const format = parts[1].toLowerCase();
    if (!['mp3', 'mp4'].includes(format)) return false;

    const videos = musicChoice[senderId];
    if (index < 0 || index >= videos.length) return false;

    const video = videos[index];
    delete musicChoice[senderId];

    try {
      // Télécharger le fichier via l'API Nekolabs
      const downloadRes = await axios.get(`https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=${format}`);
      const fileUrl = downloadRes.data.result;
      if (!fileUrl) {
        return sendMessage(senderId, { text: '❌ Error fetching the download link.' }, pageAccessToken);
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
