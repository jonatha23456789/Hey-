const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

global.musicChoice = {}; 
global.musicCache = {};  

module.exports = {
    name: 'music',
    description: 'Search songs on YouTube and send audio/video.',
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

            global.musicCache[senderId] = data.result.slice(0, 5);

            const resultsText = global.musicCache[senderId]
                .map((s, i) => `${i + 1}. ${s.title} (${s.duration}) - ${s.channel}`)
                .join('\n');

            await sendMessage(senderId, {
                text: `🎵 Songs found:\n\n${resultsText}\n\nReply with the number and type: e.g. "1 mp3" or "2 mp4"`
            }, pageAccessToken);

            global.musicChoice[senderId] = true;
        } catch (err) {
            console.error(err);
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

        try {
            await sendMessage(senderId, { text: `⏳ Downloading "${song.title}" as ${format}...` }, pageAccessToken);

            // Télécharger le fichier
            const downloadRes = await axios.get(`https://api.nekolabs.web.id/download/youtube?url=${encodeURIComponent(song.url)}&type=${format}`, {
                responseType: 'arraybuffer'
            });

            const tmpFile = path.join(__dirname, `tmp_${Date.now()}.${format}`);
            fs.writeFileSync(tmpFile, downloadRes.data);

            // Préparer upload vers Messenger
            const form = new FormData();
            form.append('message', JSON.stringify({
                attachment: { type: format === 'mp3' ? 'audio' : 'video', payload: { is_reusable: true } }
            }));
            form.append('filedata', fs.createReadStream(tmpFile));

            const uploadRes = await axios.post(
                `https://graph.facebook.com/v22.0/me/message_attachments?access_token=${pageAccessToken}`,
                form,
                { headers: form.getHeaders() }
            );

            const attachmentId = uploadRes.data.attachment_id;

            // Envoyer le fichier via Messenger
            await axios.post(
                `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`,
                {
                    recipient: { id: senderId },
                    message: { attachment: { type: format === 'mp3' ? 'audio' : 'video', payload: { attachment_id: attachmentId } } }
                }
            );

            fs.unlinkSync(tmpFile);

            delete global.musicChoice[senderId];
            delete global.musicCache[senderId];

        } catch (err) {
            console.error('Error sending music:', err.message);
            await sendMessage(senderId, { text: '❌ Error downloading or sending the file.' }, pageAccessToken);
        }

        return true;
    }
};
