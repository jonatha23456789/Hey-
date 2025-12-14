const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'imagine',
  description: 'Create an AI image using Nekolabs API 4.0-fast (custom ratio supported).',
  usage: '-imagine <prompt> [ratio]',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      return sendMessage(
        senderId,
        { text: '⚠️ Veuillez fournir un prompt.\nExemple: -imagine anime girl 16:9' },
        pageAccessToken
      );
    }

    // Detect ratio at end of prompt (e.g. 16:9)
    let ratio = '1:1';
    const lastArg = args[args.length - 1];
    if (/^\d+:\d+$/.test(lastArg)) {
      ratio = lastArg;
      args.pop();
    }

    const prompt = args.join(' ').trim();
    const apiUrl = 'https://api.nekolabs.web.id/image-generation/imagen/4.0-fast';

    try {
      // Optional: tell user generation started
      await sendMessage(
        senderId,
        { text: '⏳ Génération de l\'image en cours, veuillez patienter...' },
        pageAccessToken
      );

      // Call API with axios params so encoding is handled
      const { data } = await axios.get(apiUrl, {
        params: { prompt, ratio },
        timeout: 30000
      });

      if (!data || !data.success || !data.result) {
        return sendMessage(
          senderId,
          { text: '❌ Échec de la génération de l\'image. Réessayez plus tard.' },
          pageAccessToken
        );
      }

      // API returns a URL string (or possibly an array) in result
      const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result;

      // Send info text first (includes responseTime and timestamp when available)
      const infoText = `✨ AI Image Created!\n🎨 Prompt: ${prompt}\n🖼️ Ratio: ${ratio}\n🕒 Response Time: ${data.responseTime || 'N/A'}\n📅 Timestamp: ${data.timestamp || 'N/A'}`;
      await sendMessage(senderId, { text: infoText }, pageAccessToken);

      // Then send the generated image
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

    } catch (error) {
      // better logging for debugging (include response body when available)
      console.error(
        'Imagine Command Error:',
        error.response ? (error.response.data || error.response.statusText) : (error.message || error)
      );

      return sendMessage(
        senderId,
        { text: '🚨 Une erreur est survenue lors de la génération de l\'image. Veuillez réessayer plus tard.' },
        pageAccessToken
      );
    }
  }
};
