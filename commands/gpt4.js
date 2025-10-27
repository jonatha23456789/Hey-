const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gpt4',
    description: 'Interact with GPT-4 from Miko API',
    usage: '-gpt4 <your question>',
    author: 'kelvin',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sendMessage(
                senderId,
                { text: '⚠️ Please provide a question.\nUsage: -gpt4 <your question>' },
                pageAccessToken
            );
        }

        try {
            const apiUrl = `https://miko-utilis.vercel.app/api/gpt-4?query=${encodeURIComponent(prompt)}&userId=${senderId}`;
            const { data } = await axios.get(apiUrl);

            // Vérifie si la réponse existe
            const responseText =
                data?.response || data?.result || data?.answer || '❌ No response from the API.';

            // Découpe si trop long
            const parts = [];
            for (let i = 0; i < responseText.length; i += 1999) {
                parts.push(responseText.substring(i, i + 1999));
            }

            // Envoi des messages un par un
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }
        } catch (error) {
            console.error('GPT4 Command Error:', error.response?.data || error.message);
            await sendMessage(
                senderId,
                { text: '❌ There was an error generating the response. Please try again later.' },
                pageAccessToken
            );
        }
    },
};
