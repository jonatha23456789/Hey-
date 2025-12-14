const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

// stockage temporaire par utilisateur
global.videoChoice = global.videoChoice || {};

module.exports = {
  name: 'video',
  description: 'Search YouTube videos and send selected video',
  usage: '-video <search>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '❌ Please provide a search query.' }, pageAccessToken);
    }

    const query = args.join(' ');

    try {
      const res = await axios.get(
        `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`
      );

      const videos = res.data?.result?.slice(0, 5);
      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: '❌ No videos found.' }, pageAccessToken);
      }

      // sauvegarde pour le choix
      global.videoChoice[senderId] = videos;

      const list = videos.map((v, i) =>
        `${i + 1}. ${v.title} (${v.duration}) - ${v.channel}`
      ).join('\n');

      await sendMessage(senderId, {
        text:
`🎬 Videos found:\n\n${list}\n\nReply with the number`
      }, pageAccessToken);

    } catch (err) {
      console.error('Video search error:', err.message);
      await sendMessage(senderId, { text: '❌ Error fetching videos.' }, pageAccessToken);
    }
  },

  // 🔢 gestion du choix
  async handleChoice(senderId, messageText, pageAccessToken) {
    if (!global.videoChoice?.[senderId]) return false;

    const index = parseInt(messageText.trim(), 10) - 1;
    const videos = global.videoChoice[senderId];

    if (isNaN(index) || index < 0 || index >= videos.length) return false;

    const video = videos[index];
    delete global.videoChoice[senderId];

    try {
      await sendMessage(senderId, {
        text: `⬇️ Downloading:\n${video.title}`
      }, pageAccessToken);

      const dl = await axios.get(
        `https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=mp4`
      );

      const fileUrl = dl.data?.result;
      if (!fileUrl) {
        return sendMessage(senderId, { text: '❌ Failed to get video.' }, pageAccessToken);
      }

      const tmp = path.join(__dirname, `video_${Date.now()}.mp4`);
      const file = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(tmp, file.data);

      const form = new FormData();
      form.append('message', JSON.stringify({
        attachment: { type: 'video', payload: { is_reusable: true } }
      }));
      form.append('filedata', fs.createReadStream(tmp));

      const upload = await axios.post(
        `https://graph.facebook.com/v22.0/me/message_attachments?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

      await axios.post(
        `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'video',
              payload: { attachment_id: upload.data.attachment_id }
            }
          }
        }
      );

      fs.unlinkSync(tmp);

    } catch (err) {
      console.error('Video send error:', err.message);
      await sendMessage(senderId, { text: '❌ Error downloading or sending video.' }, pageAccessToken);
    }

    return true;
  }
};
