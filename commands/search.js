const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'search',
  description: 'Generate WANTED posters for multiple users',
  usage: '-wantedposter <uid> <name> <reward> ; <uid2> <name2> <reward2> ...',
  author: 'Jonathan',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage:\n-wantedposter <uid> <name> <reward> ; <uid2> <name2> <reward2> ...' },
        pageAccessToken
      );
    }

    const input = args.join(' ').split(';').map(item => item.trim()).filter(Boolean);

    for (const entry of input) {
      const parts = entry.split(' ').filter(Boolean);
      if (parts.length < 3) continue;

      const [uid, name, reward] = parts;

      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/wanted-poster?userid=${encodeURIComponent(uid)}&name=${encodeURIComponent(name)}&reward=${encodeURIComponent(reward)}`;

      try {
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data?.results?.url) {
          await sendMessage(
            senderId,
            { text: `❌ Failed to generate WANTED poster for ${name}.` },
            pageAccessToken
          );
          continue;
        }

        const imageUrl = data.results.url;

        // 🔹 Send image
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: { url: imageUrl, is_reusable: true },
            },
          },
          pageAccessToken
        );

        // 🔹 Confirmation message
        await sendMessage(
          senderId,
          { text: `🎯 WANTED Poster created for ${name} with reward ${reward}!` },
          pageAccessToken
        );

      } catch (err) {
        console.error(`WantedPoster Error (${name}):`, err.message || err);
        await sendMessage(
          senderId,
          { text: `🚨 Error generating WANTED poster for ${name}.` },
          pageAccessToken
        );
      }
    }
  },
};
