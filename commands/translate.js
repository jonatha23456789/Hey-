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
        {
          text:
            '❌ Usage:\n' +
            '- Reply + `-translate en`\n' +
            '- `-translate <text> <lang>`'
        },
        pageAccessToken
      );
    }

    try {
      // 🌐 API Miko Translate
      const apiUrl = `https://miko-utilis.vercel.app/api/translate?to=${encodeURIComponent(
        targetLang
      )}&text=${encodeURIComponent(textToTranslate)}`;

      const { data } = await axios.get(apiUrl);

      if (!data?.success || !data?.translated_text?.translated) {
        throw new Error('No translation returned');
      }

      const translated = data.translated_text.translated;

      const reply =
`🌍 **Translation**

📝 Original:
${textToTranslate}

🔤 To: ${data.target_language}
✅ Result:
${translated}`;

      await sendMessage(senderId, { text: reply }, pageAccessToken);

    } catch (error) {
      console.error('Translate error:', error.message || error);
      await sendMessage(
        senderId,
        { text: '❌ Error while translating text.' },
        pageAccessToken
      );
    }
  }
};
