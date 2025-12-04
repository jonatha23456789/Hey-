const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

function makeBold(text) {
  // conservée si tu veux la réutiliser un jour, mais on NE L'APPLIQUE PAS
  return text.replace(/\*\*(.+?)\*\*/g, (match, word) => {
    let boldText = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (char >= 'a' && char <= 'z') {
        boldText += String.fromCharCode(char.charCodeAt(0) + 0x1D41A - 97);
      } else if (char >= 'A' && char <= 'Z') {
        boldText += String.fromCharCode(char.charCodeAt(0) + 0x1D400 - 65);
      } else if (char >= '0' && char <= '9') {
        boldText += String.fromCharCode(char.charCodeAt(0) + 0x1D7CE - 48);
      } else {
        boldText += char;
      }
    }
    return boldText;
  });
}

function splitMessage(text) {
  const maxLength = 1900;
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

module.exports = {
  name: 'ai',
  description: 'Chat with GPT-5 (Miko Utilis)',
  usage: 'ai <message>',
  author: 'coffee',

  async execute(senderId, args, token) {
    const message = args.join(' ') || 'Hello';
    const header = '💬 | Anime Focus 𝙰𝚒\n・────────────・\n';
    const footer = '\n・──── >ᴗ< ─────・';

    try {
      // Appel API Miko GPT-5
      const apiUrl = `https://miko-utilis.vercel.app/api/gpt5`;
      const response = await axios.get(apiUrl, {
        params: {
          query: message,
          userId: senderId
        }
      });

      if (!response.data || !response.data.status) {
        throw new Error('API error');
      }

      // Récupère la réponse texte
      let aiResponse = response.data.data.response;
      aiResponse = aiResponse ? aiResponse.trim() : '';

      // === IMPORTANT : on n'applique PAS makeBold ici ===
      // aiResponse = makeBold(aiResponse); // <-- ligne supprimée / commentée

      // Découpage et envoi
      const chunks = splitMessage(aiResponse || 'Désolé, pas de réponse.');
      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1;

        let fullMsg = chunks[i];
        if (isFirst) fullMsg = header + fullMsg;
        if (isLast) fullMsg = fullMsg + footer;

        await sendMessage(senderId, { text: fullMsg }, token);
      }

    } catch (err) {
      console.error('AI command error:', err?.response?.data || err?.message || err);
      await sendMessage(senderId, {
        text: header + '❌ Something went wrong. Please try again.' + footer
      }, token);
    }
  }
};
