const axios = require('axios');
const fs = require('fs').promises;
const { createReadStream, unlinkSync } = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'wanted',
  description: 'Create a WANTED poster of a user.',
  usage: '-wanted',
  author: 'Rômeo',

  execute: async (senderId, args, pageAccessToken, api, event) => {
    let targetId = senderId;
    if (event?.message?.reply_to) targetId = event.message.reply_to.sender.id;

    const avatarUrl = `https://graph.facebook.com/${targetId}/picture?width=512&height=512&access_token=${pageAccessToken}`;
    const tmpFile = path.join(__dirname, `wanted_${Date.now()}.png`);

    await sendMessage(senderId, {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{ title: '🏴‍☠️ Making WANTED poster…', subtitle: 'Hold on.' }]
        }
      }
    }, pageAccessToken);

    try {
      const { data: avatarBuffer } = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const DIG = require('discord-image-generation');
      const wantedBuffer = await new DIG.Wanted().getImage(avatarBuffer);
      await fs.writeFile(tmpFile, wantedBuffer);

      const form = new FormData();
      form.append('message', JSON.stringify({
        attachment: { type: 'image', payload: { is_reusable: true } }
      }));
      form.append('filedata', createReadStream(tmpFile));

      const { data: uploadData } = await axios.post(
        `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

      await axios.post(
        `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'image',
              payload: { attachment_id: uploadData.attachment_id }
            }
          }
        }
      );

      unlinkSync(tmpFile);
    } catch (err) {
      console.error('Wanted Error:', err.message);
      try { unlinkSync(tmpFile); } catch {}
      return sendMessage(senderId, { text: '❎ | Could not create WANTED poster.' }, pageAccessToken);
    }
  }
};
