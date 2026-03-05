const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "imagine",
  description: "Generate AI image",
  usage: "-imagine <prompt>",
  author: "Jonathan",

  async execute(senderId, args, pageAccessToken) {

    if (!args.length) {
      return sendMessage(
        senderId,
        { text: "⚠️ Usage:\n-imagine <prompt>" },
        pageAccessToken
      );
    }

    const prompt = args.join(" ");
    const encodedPrompt = encodeURIComponent(prompt);

    const api = `https://christus-api.vercel.app/image/animagine?prompt=${encodedPrompt}`;

    try {

      // ⏳ Countdown message
      await sendMessage(
        senderId,
        { text: "🎨 Generating image...\n⏳ Please wait 10 seconds..." },
        pageAccessToken
      );

      const res = await axios.get(api);

      if (!res.data || !res.data.image_url) {
        return sendMessage(
          senderId,
          { text: "❌ Failed to generate image." },
          pageAccessToken
        );
      }

      const imageUrl = res.data.image_url;

      const msg =
`✨ AI Image Generated

📝 Prompt:
${prompt}

🖼️ Model: Animagine
✅ Status: Success`;

      await sendMessage(
        senderId,
        {
          attachment: {
            type: "image",
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          },
          text: msg
        },
        pageAccessToken
      );

    } catch (error) {
      console.error("AI IMAGE ERROR:", error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: "❌ Error generating image." },
        pageAccessToken
      );
    }
  }
};
