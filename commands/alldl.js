const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const apiKeys = [
  '1d38b94112mshfe8d29735f4a021p129bb7jsnf4b04a33cff1',
  '5f7caa0678mshab93857a2d6c468p1fdec6jsn0487f4fa0b5e',
  '268a47d07bmsh9a8adbfc3891882p17f393jsn841d036a2984',
  'fd818d8dc9msh4455008c967d00dp1b3d8cjsnaaa64606fffb',
  '28077613bemshd5a2d7ee4aea83ep17d768jsn7e4822c17d3c',
  '505643faa8msh79e5d96fd972e86p17158fjsne8cf07a99b1f',
  'a0d7261582msh1e46378a745f8bfp19e4cfjsn997ba49602c9',
  '261d337575msh5664685b3671b8ap1d294cjsn681c6ef11cb7',
  '70635f33a6msh5bf0b759a7011f4p1a3f35jsn43237c788352'
];

const getRandomKey = () => apiKeys[Math.floor(Math.random() * apiKeys.length)];

module.exports = {
  name: 'alldl',
  description: 'Auto video downloader for TikTok, Facebook, YouTube, Instagram, Twitter, etc.',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    const url = args.join(' ').trim();

    // 🔥 AUTO DETECTION (YouTube, TikTok, FB, IG, X)
    const supported = /(tiktok\.com|facebook\.com|fb\.watch|youtube\.com|youtu\.be|instagram\.com|x\.com|twitter\.com)/i;
    if (!supported.test(url)) return; // ignore si ce n’est pas un lien

    await sendMessage(senderId, { text: "⏳ Downloading your video...\nPlease wait..." }, pageAccessToken);

    let response;
    let attempts = 0;
    const triedKeys = new Set();

    while (attempts < apiKeys.length) {
      const apiKey = getRandomKey();
      if (triedKeys.has(apiKey)) continue;
      triedKeys.add(apiKey);

      const options = {
        method: 'POST',
        url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: { url }
      };

      try {
        response = await axios.request(options);
        if (response.data.medias) break;
      } catch (error) {
        console.warn(`Failed with API key ${apiKey}: ${error.message}`);
      }
      attempts++;
    }

    if (!response || !response.data.medias) {
      return sendMessage(senderId, { text: '❌ Could not download this link.' }, pageAccessToken);
    }

    const media =
      response.data.medias.find(m => m.type === 'video' && m.quality === 'HD') ||
      response.data.medias[0];

    if (!media) {
      return sendMessage(senderId, { text: '❌ No downloadable video found.' }, pageAccessToken);
    }

    const videoUrl = media.url;

    return sendMessage(
      senderId,
      {
        attachment: {
          type: 'video',
          payload: { url: videoUrl }
        }
      },
      pageAccessToken
    );
  }
};
