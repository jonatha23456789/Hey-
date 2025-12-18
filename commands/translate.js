const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'translate',
  description: 'Translate text into any language (supports reply)',
  author: 'kelvin',
  usage: '-translate <lang> OR -translate <text> <lang>',

  async execute(senderId, args, pageAccessToken, event) {

    // 🔹 Détecter message répondu
    const repliedText =
      event?.message?.reply_to?.message?.text ||
      event?.message?.reply_to?.message?.attachments?.[0]?.payload?.url;

    let textToTranslate;
    let targetLang;

    // 📌 CAS 1 : Reply → "-translate en"
    if (repliedText && args.length === 1) {
      targetLang = args[0].toLowerCase();
      textToTranslate = repliedText;
    }

    // 📌 CAS 2 : Texte normal → "-translate hello fr"
    else if (args.length >= 2) {
      targetLang = args.pop().toLowerCase();
      textToTranslate = args.join(' ');
    }

    // ❌ Mauvais usage
    else {
      return sendMessage(
        senderId,
        { text: '❌ Usage:\n- Reply + `-translate en`\n- `-translate <text> <lang>`' },
        pageAccessToken
      );
    }

    try {
      const res = await axios.post(
        'https://libretranslate.de/translate',
        {
          q: textToTranslate,
          source: 'auto',
          target: targetLang,
          format: 'text'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const translated = res.data?.translatedText;
      if (!translated) throw new Error('No translation');

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
