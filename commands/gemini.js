const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 🔹 split long messages
function splitMessage(text, maxLength = 1900) {
  const chunks = [];

  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }

  return chunks;
}

// 🔥 get replied image from Messenger API
async function getReplyImage(event, token) {

  const mid = event?.message?.reply_to?.mid;

  if (!mid) return null;

  try {

    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/${mid}/attachments`,
      {
        params: {
          access_token: token
        }
      }
    );

    return data?.data?.[0]?.image_data?.url || null;

  } catch (e) {
    return null;
  }
}

module.exports = {
  name: ['gemini'],
  description: 'Gemini AI with image analysis',
  usage: '-gemini <question> or reply to image',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {

    try {

      let prompt = args.join(' ').trim();

      // 🔥 image from reply
      let imgUrl = await getReplyImage(
        event,
        pageAccessToken
      );

      // 🔥 auto describe image
      if (!prompt && imgUrl) {
        prompt = 'Describe this image in detail';
      }

      // ❌ no prompt
      if (!prompt) {

        return sendMessage(
          senderId,
          {
            text:
              '⚠️ Usage: -gemini <question> or reply to image'
          },
          pageAccessToken
        );
      }

      // ⏳ loading
      await sendMessage(
        senderId,
        {
          text: '⏳ Gemini is thinking...'
        },
        pageAccessToken
      );

      // 🔥 NEW API
      const apiUrl =
        `https://norch-project.gleeze.com/api/gemini?prompt=${encodeURIComponent(prompt)}&imageurl=${encodeURIComponent(imgUrl || '')}`;

      const { data } = await axios.get(apiUrl, {
        timeout: 60000
      });

      // 🔥 extract response
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
🤖 | GEMINI AI

${replyText.trim()}

${deco}`;

      // 🔹 split if long
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
          text:
            '🚨 Error while contacting Gemini API.'
        },
        pageAccessToken
      );
    }
  }
};
