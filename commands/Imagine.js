const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an AI image using Nekolabs API 4.0-fast (custom ratio supported)',
  usage: '-imagine <prompt> [ratio 1:1, 16:9, 9:16]',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(senderId, { text: '⚠️ Please provide a prompt.\nUsage: -imagine <prompt> [ratio]' }, pageAccessToken);
    }

    // Détecter un ratio dans le prompt (ex: 1:1, 16:9, 9:16) à la fin
    let ratio = '1:1';
    const ratioMatch = prompt.match(/\b(1:1|16:9|9:16)\b$/);
    let finalPrompt = prompt;
    if (ratioMatch) {
      ratio = ratioMatch[0];
      finalPrompt = prompt.replace(ratio, '').trim();
    }

    await sendMessage(senderId, { text: '🎨 Generating your AI image, please wait...' }, pageAccessToken);

    try {
      const apiUrl = `https://api.nekolabs.web.id/image-generation/imagen/4.0-fast?prompt=${encodeURIComponent(finalPrompt)}&ratio=${encodeURIComponent(ratio)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.success || !data.result) {
        return sendMessage(senderId, { text: '❌ Failed to generate image from AI.' }, pageAccessToken);
      }

      const imageUrl = data.result;

      // 1️⃣ Envoyer le texte de confirmation et le lien en premier
      const confirmationText = `✅ Image generated successfully!\n🌐 Direct URL: ${imageUrl}`;
      await sendMessage(senderId, { text: confirmationText }, pageAccessToken);

      // 2️⃣ Envoyer ensuite l'image
      await sendMessage(senderId, {
        attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } }
      }, pageAccessToken);

    } catch (error) {
      console.error('Imagine Command Error:', error.message || error);
      await sendMessage(senderId, { text: '❌ An error occurred while generating the image.' }, pageAccessToken);
    }
  }
};
