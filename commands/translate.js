const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'trans',
  description: 'Translate text into any language (supports reply)',
  author: 'Kelvin',
  usage: '-translate <lang> OR -translate <text> <lang>',

  async execute(senderId, args, pageAccessToken, event) {

    let textToTranslate = null;
    let targetLang = null;

    // 📌 Cas reply : -translate <lang>
    if (args.length === 1) {
      targetLang = args[0].toLowerCase();

      // Récupérer le texte depuis le message reply
      textToTranslate = event?.message?.reply_to?.message?.text;

      if (!textToTranslate) {
        return sendMessage(
          senderId,
          { text: '❌ Please reply to a text message to translate it.' },
          pageAccessToken
        );
      }
    }

    // 📌 Cas texte normal : -translate <text> <lang>
    else if (args.length >= 2) {
      targetLang = args.pop().toLowerCase();
      textToTranslate = args.join(' ');
    }

    // ❌ Mauvais usage
    else {
      return sendMessage(
        senderId,
        {
          text:
            '❌ Usage:\n' +
            '- Reply + `-translate <lang>`\n' +
            '- `-translate <text> <lang>`'
        },
        pageAccessToken
      );
    }

    // 🌍 Traduction via API
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

      const reply =
`🌍 **Translation**

📝 Original:
${textToTranslate}

🔤 To: ${targetLang}
✅ Result:
${translated}`;

      await sendMessage(senderId, { text: reply }, pageAccessToken);

    } catch (error) {
      console.error('Translate error:', error.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while translating text.' },
        pageAccessToken
      );
    }
  }
};
