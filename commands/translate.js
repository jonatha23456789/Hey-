const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'trans',
  description: 'Translate text (reply supported)',
  author: 'Kelvin',
  usage: '-trans <lang> OR reply + -trans <lang>',

  async execute(senderId, args, pageAccessToken, event) {
    let text;
    let lang;

    /* ===== REPLY MODE ===== */
    if (args.length === 1) {
      lang = args[0].toLowerCase();

      text = event?.message?.reply_to?.text;

      if (!text) {
        return sendMessage(
          senderId,
          { text: '❌ Please reply to a TEXT message.' },
          pageAccessToken
        );
      }
    }

    /* ===== NORMAL MODE ===== */
    else if (args.length >= 2) {
      lang = args.pop().toLowerCase();
      text = args.join(' ');
    }

    /* ===== WRONG USAGE ===== */
    else {
      return sendMessage(
        senderId,
        {
          text:
            '❌ Usage:\n' +
            '• Reply + `-trans fr`\n' +
            '• `-trans hello fr`'
        },
        pageAccessToken
      );
    }

    /* ===== API TRANSLATE ===== */
    try {
      const { data } = await axios.get(
        'https://miko-utilis.vercel.app/api/translate',
        {
          params: {
            text,
            to: lang
          },
          timeout: 15000
        }
      );

      if (!data?.success) throw new Error('API failed');

      const translated = data.translated_text.translated;

      await sendMessage(
        senderId,
        {
          text:
`🌍 Translation
・────────────・
📝 Original:
${text}

🔤 To: ${lang}
✅ Result:
${translated}
・────────────・`
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('Translate ERROR:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Translation failed.' },
        pageAccessToken
      );
    }
  }
};
