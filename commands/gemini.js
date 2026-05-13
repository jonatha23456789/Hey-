const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 🔹 découpe message Messenger
function splitMessage(text, maxLength = 1900) {
  const chunks = [];

  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }

  return chunks;
}

module.exports = {
  name: ['gemini'],
  description: 'Gemini AI with image analysis',
  usage: '-gemini <question> or reply to image',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {
    try {

      let prompt = args.join(' ').trim();
      let imgUrl = '';

      // 🔥 detect image reply
      if (event?.message?.reply_to?.attachments) {

        const att = event.message.reply_to.attachments[0];

        if (att.type === 'image') {

          imgUrl = att.payload.url;

          // auto describe image
          if (!prompt) {
            prompt = 'Describe this image in detail';
          }
        }
      }

      // ❌ no prompt
      if (!prompt) {
        return sendMessage(
          senderId,
          {
            text: '⚠️ Usage: -gemini <question> or reply to an image'
          },
          pageAccessToken
        );
      }

      // ⏳ loading
      await sendMessage(
        senderId,
        {
          text: '⏳ Thinking...'
        },
        pageAccessToken
      );

      // 🔥 NEW API
      const apiUrl =
        `https://norch-project.gleeze.com/api/gemini/2.5/flash-lite?prompt=${encodeURIComponent(prompt)}&imageurl=${encodeURIComponent(imgUrl)}`;

      const { data } = await axios.get(apiUrl, {
        timeout: 60000
      });

      // 🔥 response extraction
      const replyText = data?.response;

      if (!replyText) {

        return sendMessage(
          senderId,
          {
            text: '❌ No response from Gemini API.'
          },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';

      const reply =
`${deco}
🤖 | GEMINI 2.5 FLASH

${replyText.trim()}

${deco}`;

      // 🔹 split long messages
      const chunks = splitMessage(reply);

      for (const chunk of chunks) {

        await sendMessage(
          senderId,
          {
            text: chunk
          },
          pageAccessToken
        );
      }

    } catch (error) {

      console.error(
        'Gemini CMD Error:',
        error.response?.data || error.message
      );

      await sendMessage(
        senderId,
        {
          text: '🚨 Error while contacting Gemini API.'
        },
        pageAccessToken
      );
    }
  }
};
