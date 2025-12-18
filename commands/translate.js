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

    const isReply = !!event?.message?.reply_to;

    /* =========================
       📌 CAS 1 : REPLY
       ========================= */
    if (isReply && args.length === 1) {
      targetLang = args[0].toLowerCase();

      textToTranslate =
        event.message.reply_to?.message?.text ||
        event.message.reply_to?.message?.attachments?.[0]?.payload?.url ||
        null;

      if (!textToTranslate) {
        return sendMessage(
          senderId,
          { text: '❌ Cannot read the replied message.' },
          pageAccessToken
        );
      }
    }

    /* =========================
       📌 CAS 2 : TEXTE NORMAL
       ========================= */
    else if (!isReply && args.length >= 2) {
      targetLang = args.pop().toLowerCase();
      textToTranslate = args.join(' ');
    }

    /* =========================
       ❌ MAUVAIS USAGE
       ========================= */
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
      const apiUrl = `https://miko-utilis.vercel.app/api/translate?to=${encodeURIComponent(
        targetLang
      )}&text=${encodeURIComponent(textToTranslate)}`;

      const { data } = await axios.get(apiUrl);

      if (!data?.success) {
        throw new Error('Translation failed');
      }

      const translated = data.translated_text.translated;

      const reply =
`🌍 Translation

📝 Original:
${textToTranslate}

🔤 To: ${data.target_language}
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
