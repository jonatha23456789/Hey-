const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'translate',
  description: 'Translate text into any language (supports reply)',
  author: 'kelvin',
  usage: '-translate <lang> OR -translate <text> <lang>',

  async execute(senderId, args, pageAccessToken, event) {

    let textToTranslate = null;
    let targetLang = null;

    /* ===============================
       🔹 CAS 1 : REPLY → -translate en
       =============================== */
    if (args.length === 1) {
      targetLang = args[0].toLowerCase();

      // On récupère le dernier message sauvegardé
      textToTranslate = global.lastUserMessage?.[senderId];

      if (!textToTranslate) {
        return sendMessage(
          senderId,
          { text: '❌ Cannot read the replied message.' },
          pageAccessToken
        );
      }
    }

    /* ===============================
       🔹 CAS 2 : TEXTE NORMAL
       -translate hello fr
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
            '- Reply + `-translate en`\n' +
            '- `-translate <text> <lang>`'
        },
        pageAccessToken
      );
    }

    /* ===============================
       🌍 API TRANSLATE
       =============================== */
    try {
      const res = await axios.get(
        `https://miko-utilis.vercel.app/api/translate`,
        {
          params: {
            to: targetLang,
            text: textToTranslate
          }
        }
      );

      if (!res.data?.success) {
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
