const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'pinterest',
  author: 'Jonathan',
  description: 'Search images on Pinterest',
  usage: '-pinterest <query>',

  async execute(senderId, args, pageAccessToken) {

    const query = args.join(' ').trim();
    if (!query) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage: -pinterest <search>' },
        pageAccessToken
      );
    }

    try {
      const { data } = await axios.get(
        'https://rynekoo-api.hf.space/discovery/pinterest/search',
        { params: { q: query } }
      );

      if (!data?.success || !Array.isArray(data.result) || data.result.length === 0) {
        return sendMessage(
          senderId,
          { text: '❌ No results found.' },
          pageAccessToken
        );
      }

      // 🎲 Choix aléatoire
      const pin = data.result[Math.floor(Math.random() * data.result.length)];

      const caption = pin.caption || 'No caption';
      const author = pin.author?.fullname || pin.author?.name || 'Unknown';
      const followers = pin.author?.followers ?? 'N/A';

      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: {
              url: pin.imageUrl,
              is_reusable: true
            }
          }
        },
        pageAccessToken
      );

      await sendMessage(
        senderId,
        {
          text:
`📌 Pinterest Result

📝 ${caption}

👤 Author: ${author}
⭐ Followers: ${followers}

🔗 ${pin.url}`
        },
        pageAccessToken
      );

    } catch (err) {
      console.error('PINTEREST ERROR:', err.response?.data || err.message);
      await sendMessage(
        senderId,
        { text: '❌ Pinterest search failed.' },
        pageAccessToken
      );
    }
  }
};
