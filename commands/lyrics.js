const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'lyricspro',
  description: 'Search song lyrics with artist image and audio preview',
  author: 'Hk',
  usage: '-lyricspro <song name>',

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ');
    if (!query) {
      return sendMessage(
        senderId,
        { text: '🎵 Please provide a song name.\nExample: -lyricspro Shape of You' },
        pageAccessToken
      );
    }

    const lyricsApi = `https://api-library-kohi.onrender.com/api/lyrics?query=${encodeURIComponent(query)}`;
    const itunesApi = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=1`;

    try {
      await sendMessage(senderId, { text: '🎶 Searching lyrics and artist info...' }, pageAccessToken);

      // Fetch lyrics and iTunes info in parallel
      const [lyricsRes, itunesRes] = await Promise.all([
        axios.get(lyricsApi),
        axios.get(itunesApi)
      ]);

      const lyricsData = lyricsRes.data.data;
      const itunesData = itunesRes.data.results[0];

      if (!lyricsData) {
        return sendMessage(senderId, { text: `❌ No lyrics found for "${query}".` }, pageAccessToken);
      }

      const { title, artist, lyrics } = lyricsData;

      // Artist image or album art (fallback)
      const cover =
        itunesData?.artworkUrl100?.replace('100x100', '600x600') ||
        'https://cdn-icons-png.flaticon.com/512/727/727240.png';

      // Audio preview (if exists)
      const previewUrl = itunesData?.previewUrl;

      // Send song info card
      await sendMessage(
        senderId,
        {
          attachment: {
            type: 'image',
            payload: { url: cover }
          }
        },
        pageAccessToken
      );

      await sendMessage(
        senderId,
        {
          text: `🎧 *${title}*\n👤 *Artist:* ${artist}\n\n💿 *Album:* ${itunesData?.collectionName || 'Unknown'}\n🌍 *Genre:* ${itunesData?.primaryGenreName || 'Unknown'}\n📅 *Release:* ${itunesData?.releaseDate?.slice(0, 10) || 'N/A'}`,
        },
        pageAccessToken
      );

      if (previewUrl) {
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'audio',
              payload: { url: previewUrl }
            }
          },
          pageAccessToken
        );
      }

      // Split lyrics into parts (Messenger limit)
      const chunks = lyrics.match(/.{1,1800}/gs) || [];
      for (let i = 0; i < chunks.length; i++) {
        const prefix = chunks.length > 1 ? `📄 Part ${i + 1}/${chunks.length}\n\n` : '';
        await sendMessage(senderId, { text: prefix + chunks[i] }, pageAccessToken);
      }

    } catch (err) {
      console.error('LyricsPro Command Error:', err.message);
      sendMessage(senderId, { text: '🚨 Error fetching lyrics or artist data. Try again later.' }, pageAccessToken);
    }
  }
};
