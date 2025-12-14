const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

global.musicChoice = {}; // Stocke l'état mp3/mp4 par utilisateur
global.musicCache = {};  // Stocke le résultat de recherche par utilisateur

module.exports = {
    name: 'music',
    description: 'Searches for songs on YouTube and provides audio/video links.',
    usage: '-music <song name>',
    author: 'coffee',

    async execute(senderId, args, pageAccessToken) {
        if (!args.length) return sendMessage(senderId, { text: '❌ Please provide a song title.' }, pageAccessToken);

        const query = encodeURIComponent(args.join(' '));
        const apiUrl = `https://api.nekolabs.web.id/discovery/youtube/search?q=${query}`;

        try {
            const { data } = await axios.get(apiUrl);
            if (!data.success || !data.result || !data.result.length) {
                return sendMessage(senderId, { text: '❌ No songs found.' }, pageAccessToken);
            }

            // On stocke le résultat pour l'utilisateur
            global.musicCache[senderId] = data.result;

            // On affiche les 5 premiers résultats
            const resultsText = data.result.slice(0, 5)
                .map((song, i) => `${i + 1}. ${song.title} (${song.duration}) - ${song.channel}`)
                .join('\n');

            await sendMessage(senderId, {
                text: `🎵 Songs found:\n\n${resultsText}\n\nReply with the number of the song and "mp3" or "mp4" to download.\nExample: 1 mp3`
            }, pageAccessToken);

            // On attend la réponse mp3/mp4
            global.musicChoice[senderId] = true;

        } catch (err) {
            console.error('Music command error:', err.message);
            sendMessage(senderId, { text: '❌ Failed to fetch songs.' }, pageAccessToken);
        }
    },

    async handleChoice(senderId, messageText, pageAccessToken) {
        if (!global.musicChoice[senderId]) return false;

        const match = messageText.match(/^(\d+)\s*(mp3|mp4)$/i);
        if (!match) return false;

        const index = parseInt(match[1], 10) - 1;
        const format = match[2].toLowerCase();

        const songs = global.musicCache[senderId];
        if (!songs || index < 0 || index >= songs.length) {
            await sendMessage(senderId, { text: '❌ Invalid song number.' }, pageAccessToken);
            return true;
        }

        const song = songs[index];
        const url = song.url;

        try {
            await sendMessage(senderId, { text: `⏳ Downloading "${song.title}" as ${format}...` }, pageAccessToken);

            const downloadRes = await axios.get(`https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(url)}&type=${format}`, {
                responseType: 'arraybuffer'
            });

            const tmpFile = path.join(__dirname, `tmp_${Date.now()}.${format}`);
            fs.writeFileSync(tmpFile, downloadRes.data);

            // Envoi du fichier
            await sendMessage(senderId, {
                attachment: {
                    type: format === 'mp3' ? 'audio' : 'video',
                    payload: { url: `file://${tmpFile}` } // Facebook peut supporter stream ou uploader via API, à adapter selon ton bot
                }
            }, pageAccessToken);

            fs.unlinkSync(tmpFile);

            // On supprime l'état utilisateur
            delete global.musicChoice[senderId];
            delete global.musicCache[senderId];

        } catch (err) {
            console.error('Error downloading music:', err.message);
            await sendMessage(senderId, { text: '❌ Error downloading the file.' }, pageAccessToken);
        }

        return true;
    }
};
