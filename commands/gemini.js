const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 🔹 découpe message
function splitMessage(text, maxLength = 1900) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

module.exports = {
  name: ['gemini'],
  description: 'Chat with Gemini AI + image analysis',
  usage: '-gpt <question> (or reply to image)',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {
    try {
      let prompt = args.join(' ').trim();
      let imgUrl = '';

      // 🔥 DETECT IMAGE REPLY
      if (event?.message?.reply_to?.attachments) {
        const att = event.message.reply_to.attachments[0];

        if (att.type === "image") {
          imgUrl = att.payload.url;

          // si pas de texte → description auto
          if (!prompt) {
            prompt = "Describe this image in detail";
          }
        }
      }

      // si aucun prompt + aucune image
      if (!prompt) {
        return sendMessage(
          senderId,
          { text: '⚠️ Usage: -gpt <question> ou reply à une image' },
          pageAccessToken
        );
      }

      // ⏳ message loading
      await sendMessage(
        senderId,
        { text: '' },
        pageAccessToken
      );

      // 🔥 API
      const apiUrl = `https://smfahim.xyz/ai/gemini/v1?prompt=${encodeURIComponent(prompt)}&imgUrl=${encodeURIComponent(imgUrl)}`;

      const { data } = await axios.get(apiUrl, { timeout: 30000 });

      // 🔥 extraction texte
      const replyText =
        data?.candidates?.[0]?.content?.parts
          ?.map(p => p.text)
          .join(' ');

      if (!replyText) {
        return sendMessage(
          senderId,
          { text: '❌ No response from AI.' },
          pageAccessToken
        );
      }

      const deco = '・───── >ᴗ< ─────・';

      const reply =
`${deco}
🤖 | GEMINI AI

${replyText.trim()}

${deco}`;

      const chunks = splitMessage(reply);

      for (const chunk of chunks) {
        await sendMessage(
          senderId,
          { text: chunk },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error('GPT Command Error:', error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: '🚨 Error while contacting AI API.' },
        pageAccessToken
      );
    }
  }
};
