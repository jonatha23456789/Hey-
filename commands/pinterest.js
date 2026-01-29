const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const MAX_IMAGES = 10;

module.exports = {
  name: 'pinterest',
  author: 'Jonathan',
  description: 'Search Pinterest images with count',
  usage: '-pinterest <query> [count]',

  async execute(senderId, args, pageAccessToken) {

    if (args.length === 0) {
      return sendMessage(
        senderId,
        { text: '⚠️ Usage: -pinterest <search> [count]' },
        pageAccessToken
      );
    }

    // 🔢 Detect count
    let count = 1;
    const lastArg = args[args.length - 1];

    if (!isNaN(lastArg)) {
      count = Math.min(parseInt(lastArg), MAX_IMAGES);
      args.pop();
    }

    const query = args.join(' ').trim();
    if (!query) {
      return sendMessage(
        senderId,
        { text: '⚠️ Please provide a search keyword.' },
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

      const results = data.result.sort(() => 0.5 - Math.random()).slice(0, count);

      await sendMessage(
        senderId,
        { text: `📌 Pinterest results for **${query}** (${results.length})` },
        pageAccessToken
      );

      for (let i = 0; i < results.length; i++) {
        const pin = results[i];

        const caption = pin.caption || 'No caption';
        const author = pin.author?.fullname || pin.author?.name || 'Unknown';
        const followers = pin.author?.followers ?? 'N/A';

        // 🖼️ Image
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

        // 📝 Info + countdown
        await sendMessage(
          senderId,
          {
            text:
`📌 Result ${i + 1}/${results.length}

📝 ${caption}
👤 ${author} (${followers} followers)
🔗 ${pin.url}`
          },
          pageAccessToken
        );
      }

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
