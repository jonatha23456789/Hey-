const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

// ✅ stockage GLOBAL (IMPORTANT)
if (!global.musicChoice) global.musicChoice = {};

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
      const res = await axios.get(
        `https://api.nekolabs.web.id/discovery/youtube/search?q=${encodeURIComponent(query)}`
      );

      const videos = res.data?.result?.slice(0, 5);
      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: '❌ No songs found.' }, pageAccessToken);
      }

      // ✅ stocker dans GLOBAL
      global.musicChoice[senderId] = videos;

      const listText = videos.map((v, i) =>
        `${i + 1}. ${v.title} (${v.duration}) - ${v.channel}`
      ).join('\n');

      await sendMessage(senderId, {
        text:
`🎵 Songs found:

${listText}

Reply with the number and type:
Example: "1 mp3" or "2 mp4"`
      }, pageAccessToken);

    } catch (err) {
      console.error('Music search error:', err.message);
      await sendMessage(senderId, { text: '❌ Error fetching songs.' }, pageAccessToken);
    }
  },

  // ✅ appelé depuis handleMessage
  async handleChoice(senderId, messageText, pageAccessToken) {
    const videos = global.musicChoice[senderId];
    if (!videos) return false;

    const match = messageText.trim().match(/^(\d+)\s+(mp3|mp4)$/i);
    if (!match) return false;

    const index = parseInt(match[1], 10) - 1;
    const format = match[2].toLowerCase();

    if (index < 0 || index >= videos.length) {
      await sendMessage(senderId, { text: '❌ Invalid number.' }, pageAccessToken);
      return true;
    }

    const video = videos[index];
    delete global.musicChoice[senderId]; // ✅ nettoyer

    try {
      await sendMessage(senderId, { text: `⬇ Downloading ${format.toUpperCase()}...` }, pageAccessToken);

      const dl = await axios.get(
        `https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=${format}`
      );

      const fileUrl = dl.data?.result;
      if (!fileUrl) {
        return sendMessage(senderId, { text: '❌ Download link not available.' }, pageAccessToken);
      }

      const tmpFile = path.join(__dirname, `tmp_${Date.now()}.${format}`);
      const fileRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(tmpFile, fileRes.data);

      const form = new FormData();
      form.append('message', JSON.stringify({
        attachment: {
          type: format === 'mp3' ? 'audio' : 'video',
          payload: { is_reusable: true }
        }
      }));
      form.append('filedata', fs.createReadStream(tmpFile));

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
              type: format === 'mp3' ? 'audio' : 'video',
              payload: { attachment_id: upload.data.attachment_id }
            }
          }
        }
      );

      fs.unlinkSync(tmpFile);
      return true;

    } catch (err) {
      console.error('Music download error:', err.message);
      await sendMessage(senderId, { text: '❌ Error downloading or sending the file.' }, pageAccessToken);
      return true;
    }
  }
};
