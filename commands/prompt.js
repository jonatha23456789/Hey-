const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'prompt',
  description: 'Generate a detailed AI prompt from a short text',
  usage: '-prompt <short description>',
  author: 'kelvin',

  async execute(senderId, args, pageAccessToken) {
    try {
      const promptText = args.join(' ').trim();

      if (!promptText) {
        return sendMessage(
          senderId,
          { text: '⚠️ Usage: -prompt <short description>' },
          pageAccessToken
        );
      }

      // 🌐 API nova-apis (PROMPT → PROMPT)
      const apiUrl =
        `https://nova-apis.onrender.com/prompt?prompt=${encodeURIComponent(promptText)}`;

      const { data } = await axios.get(apiUrl, { timeout: 20000 });

      if (!data?.prompt) {
        return sendMessage(
          senderId,
          { text: '❌ Failed to generate prompt.' },
          pageAccessToken
        );
      }

      const result =
`🧠 **AI Prompt Generated**
・────────────・
${data.prompt}
・────────────・
⚙️ Model: ${data.usedModel || 'unknown'}`;

      await sendMessage(senderId, { text: result }, pageAccessToken);

    } catch (error) {
      console.error('Prompt Command Error:', error.response?.data || error.message);
      await sendMessage(
        senderId,
        { text: '❌ Error while generating prompt.' },
        pageAccessToken
      );
    }
  }
};
