const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create image using AI generator',
  usage: '-imagine <prompt>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a prompt.\nUsage: -imagine <your idea>' },
        pageAccessToken
      );
    }

    const prompt = encodeURIComponent(args.join(' '));
    const apiUrl = `https://api-library-kohi.onrender.com/api/imagegen?prompt=${prompt}&model=nanobanana`;

    try {
      // Fetch image
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

      if (!response || !response.data) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate image.' },
          pageAccessToken
        );
      }

      // Save temp image
      const tmpPath = path.join(__dirname, `imagine_${Date.now()}.jpg`);
      fs.writeFileSync(tmpPath, Buffer.from(response.data));

      // Prepare form for upload
      const form = new FormData();
      form.append(
        'message',
        JSON.stringify({
          attachment: { type: 'image', payload: { is_reusable: true } },
        })
      );
      form.append('filedata', fs.createReadStream(tmpPath));

      // Upload image to FB
      const uploadRes = await axios.post(
        `https://graph.facebook.com/v23.0/me/message_attachments?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

      const attachmentId = uploadRes.data.attachment_id;

      // Send image to user
      await axios.post(
        `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'image',
              payload: { attachment_id: attachmentId },
            },
          },
        }
      );

      // Clean up
      fs.unlinkSync(tmpPath);
    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Failed to create image. Please try again later.' },
        pageAccessToken
      );
    }
  },
};
