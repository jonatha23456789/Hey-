const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Découpe texte en chunks si trop long
function splitMessage(text, maxLength = 1900) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

// Récupère l'URL de l'image reply si disponible
async function getImageUrlFromEvent(event, token) {
  const mid = event?.message?.reply_to?.mid;
  if (!mid) return null;

  try {
    const { data } = await axios.get(`https://graph.facebook.com/v23.0/${mid}/attachments`, {
      params: { access_token: token }
    });
    return data?.data?.[0]?.image_data?.url || data?.data?.[0]?.file_url || null;
  } catch (err) {
    console.error('Error fetching reply image:', err.message);
    return null;
  }
}

module.exports = {
  name: 'ai',
  description: 'Answer to questions (can use image you reply to)',
  usage: '-ai <your question> (reply to an image optionally)',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken, event) {
    const question = args.join(' ').trim();
    if (!question) {
      return sendMessage(senderId, { text: '⚠️ Please provide a question.\nUsage: -ai <your question>' }, pageAccessToken);
    }

    await sendMessage(senderId, { text: '' }, pageAccessToken);

    try {
      // Si l'utilisateur a reply à une image, on récupère son URL
      const imageUrl = await getImageUrlFromEvent(event, pageAccessToken);

      // Construire l'URL API avec image si disponible
      let apiUrl = `https://api.nekolabs.web.id/text-generation/gpt/4.1-nano?text=${encodeURIComponent(question)}&sessionId=61554245590654`;
      if (imageUrl) apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;

      const { data } = await axios.get(apiUrl);

      if (!data.success || !data.result) {
        return sendMessage(senderId, { text: '❌ Failed to get a response from AI.' }, pageAccessToken);
      }

      let aiResponse = data.result.trim();
      const header = '💬 | Anime Focus Ai\n・────────────・';
      const footer = '\n・──── >ᴗ< ─────・';

      const chunks = splitMessage(aiResponse);

      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1;

        let fullMessage = chunks[i];
        if (isFirst) fullMessage = header + '\n' + fullMessage;
        if (isLast) fullMessage = fullMessage + footer;

        await sendMessage(senderId, { text: fullMessage }, pageAccessToken);
      }

    } catch (error) {
      console.error('AI Command Error:', error.message || error);
      await sendMessage(senderId, { text: '❌ An error occurred while contacting the AI API.' }, pageAccessToken);
    }
  }
};
