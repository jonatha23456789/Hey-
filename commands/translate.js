const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 🔎 Récupérer le texte du reply (robuste)
function getReplyText(event) {
  const reply = event?.message?.reply_to?.message;
  if (!reply) return null;

  if (typeof reply.text === 'string') return reply.text;
  if (reply.message?.text) return reply.message.text;

  return null;
}

module.exports = {
  name: 'trans',
  description: 'Translate text into any language (supports reply)',
  author: 'Kelvin',
  usage: '-trans <lang> OR -trans <text> <lang>',

  async execute(senderId, args, pageAccessToken, event) {

    let textToTranslate;
    let targetLang;

    /* ===============================
       🔁 CAS REPLY → -trans fr
       =============================== */
    if (args.length === 1) {
      targetLang = args[0].toLowerCase();
      textToTranslate = getReplyText(event);

      if (!textToTranslate) {
        return sendMessage(
          senderId,
          { text: '❌ Please reply to a text message to translate it.' },
          pageAccessToken
        );
      }
    }

    /* ===============================
       📝 CAS NORMAL → -trans hello fr
       =============================== */
    else if (args.length >= 2) {
      targetLang = args.pop().toLowerCase();
      textToTranslate = args.join(' ');
    }

    /* ===============================
       ❌ MAUVAIS USAGE
       =============================== */
    else {
      return sendMessage(
        senderId,
        {
          text:
            '❌ Usage:\n' +
            '• Reply + `-trans <lang>`\n' +
            '• `-trans <text> <lang>`'
        },
        pageAccessToken
      );
    }

    /* ===============================
       🌍 API TRANSLATE
       =============================== */
    try {
      const res = await axios.get(
        'https://miko-utilis.vercel.app/api/translate',
        {
          params: {
            text: textToTranslate,
            to: targetLang
          }
        }
      );

      if (!res.data?.success || !res.data?.translated_text?.translated) {
        throw new Error('Translation failed');
      }

      const translated = res.data.translated_text.translated;

      await sendMessage(
        senderId,
        {
          text:
`🌍 Translation

📝 Original:
${textToTranslate}

🔤 To: ${targetLang}
✅ Result:
${translated}`
        },
        pageAccessToken
      );

    } catch (error) {
      console.error('Translate error:', error.response?.data || error.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while translating text.' },
        pageAccessToken
      );
    }
  }
};
