const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const ytsr = require('@distube/ytsr');
const { sendMessage } = require('../handles/sendMessage');

if (!global.musicChoice) global.musicChoice = {};

module.exports = {
  name: 'music',
  description: 'Search YouTube and download mp3/mp4',
  usage: '-music <song name>',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: '❌ Please provide a song name.' }, pageAccessToken);
    }

    const query = args.join(' ');

    try {
      // ✅ RECHERCHE STABLE VIA YTSR
      const search = await ytsr(query, { limit: 5 });
      const videos = search.items.filter(v => v.type === 'video');

      if (!videos.length) {
        return sendMessage(senderId, { text: '❌ No songs found.' }, pageAccessToken);
      }

      global.musicChoice[senderId] = videos;

      const list = videos.map((v, i) =>
        `${i + 1}. ${v.name} (${v.duration || 'N/A'}) - ${v.author?.name || 'Unknown'}`
      ).join('\n');

      await sendMessage(senderId, {
        text:
`🎵 Songs found:

${list}

Reply with the number and type:
Example: "1 mp3" or "2 mp4"`
      }, pageAccessToken);

    } catch (err) {
      console.error('Search error:', err);
      await sendMessage(senderId, { text: '❌ Error fetching songs.' }, pageAccessToken);
    }
  },

  async handleChoice(senderId, messageText, pageAccessToken) {
    const videos = global.musicChoice[senderId];
    if (!videos) return false;

    const match = messageText.match(/^(\d+)\s+(mp3|mp4)$/i);
    if (!match) return false;

    const index = Number(match[1]) - 1;
    const format = match[2].toLowerCase();

    if (!videos[index]) {
      await sendMessage(senderId, { text: '❌ Invalid choice.' }, pageAccessToken);
      return true;
    }

    const video = videos[index];
    delete global.musicChoice[senderId];

    try {
      await sendMessage(senderId, { text: `⬇ Downloading ${format.toUpperCase()}...` }, pageAccessToken);

      // ✅ DOWNLOAD VIA NEKOLABS (OK)
      const dl = await axios.get(
        `https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(video.url)}&type=${format}`
      );

      const fileUrl = dl.data?.result;
      if (!fileUrl) {
        return sendMessage(senderId, { text: '❌ Download failed.' }, pageAccessToken);
      }

      const tmp = path.join(__dirname, `tmp_${Date.now()}.${format}`);
      const bin = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(tmp, bin.data);

      const form = new FormData();
      form.append('message', JSON.stringify({
        attachment: {
          type: format === 'mp3' ? 'audio' : 'video',
          payload: { is_reusable: true }
        }
      }));
      form.append('filedata', fs.createReadStream(tmp));

      const up = await axios.post(
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
              payload: { attachment_id: up.data.attachment_id }
            }
          }
        }
      );

      fs.unlinkSync(tmp);
      return true;

    } catch (err) {
      console.error('Download error:', err);
      await sendMessage(senderId, { text: '❌ Error downloading or sending the file.' }, pageAccessToken);
      return true;
    }
  }
};
