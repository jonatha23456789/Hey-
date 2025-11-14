const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ss',
  description: 'Take screenshots of webpages or send images directly',
  usage: '-screenshot <url1> <url2> ...',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    try {
      if (!senderId) {
        return sendMessage(senderId, { text: '❌ Impossible de récupérer l\'ID de l\'utilisateur !' }, pageAccessToken);
      }

      if (!args || !args.length) {
        return sendMessage(senderId, { text: '⚠️ Please provide at least one URL.\nUsage: -screenshot <url1> <url2> ...' }, pageAccessToken);
      }

      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

      for (const url of args) {
        try {
          const isImage = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));

          if (isImage) {
            await sendMessage(senderId, {
              attachment: { type: 'image', payload: { url } }
            }, pageAccessToken);
            continue;
          }

          const apiUrl = `https://haji-mix-api.gleeze.com/api/screenshot?url=${encodeURIComponent(url)}`;

          const { data } = await axios.get(apiUrl, { timeout: 20000 });

          const screenshotUrl = data?.screenshot || data?.url || data?.result;

          if (!screenshotUrl) {
            await sendMessage(senderId, { text: `❌ Failed to take screenshot of: ${url}` }, pageAccessToken);
            continue;
          }

          await sendMessage(senderId, {
            attachment: { type: 'image', payload: { url: screenshotUrl } }
          }, pageAccessToken);

        } catch (error) {
          console.error(`Screenshot Error for ${url}:`, error.message || error);
          await sendMessage(senderId, { text: `❌ An error occurred with: ${url}` }, pageAccessToken);
        }
      }
    } catch (globalError) {
      console.error("Global SS Command Error:", globalError);
      await sendMessage(senderId, { text: '⚠️ Une erreur générale est survenue dans la commande ss.' }, pageAccessToken);
    }
  }
};
