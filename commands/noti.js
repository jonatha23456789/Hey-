const { sendMessage } = require('../handles/sendMessage');
const axios = require("axios");

const pageid = '311549272052785';
const kupal = ["8592033747492364"];
const CREATOR_NAME = "Kelvin"; // 👤 change ici si tu veux

// 📅 date/heure formatée
function getDateTime() {
  const now = new Date();
  return now.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function getAllPSIDs(pageAccessToken) {
  try {
    let psids = [];
    let next = `https://graph.facebook.com/v21.0/${pageid}/conversations?fields=participants&access_token=${pageAccessToken}`;

    while (next) {
      const res = await axios.get(next);
      res.data.data.forEach(convo => {
        convo.participants.data.forEach(p => {
          if (p.id !== pageid && !kupal.includes(p.id)) {
            psids.push(p.id);
          }
        });
      });
      next = res.data.paging?.next || null;
    }
    return psids;
  } catch {
    return [];
  }
}

async function sendNotification(users, messagePayload, pageAccessToken) {
  for (const psid of users) {
    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
        {
          recipient: { id: psid },
          message: messagePayload
        }
      );
    } catch {}
  }
}

module.exports = {
  name: 'noti',
  description: 'send notification to all users (text or image)',
  author: 'Cliff',
  usage: 'noti [img] <message>',

  async execute(senderId, args, pageAccessToken, event, sendMessageFn, imageCache) {

    if (!kupal.includes(senderId)) {
      return sendMessageFn(
        senderId,
        { text: "This command is only for pagebot owner." },
        pageAccessToken
      );
    }

    if (!args.length) {
      return sendMessageFn(
        senderId,
        { text: 'Please provide a message.' },
        pageAccessToken
      );
    }

    // 📸 mode image ?
    let withImage = false;
    if (args[0].toLowerCase() === 'img') {
      withImage = true;
      args.shift();
    }

    const text = args.join(' ');
    const dateTime = getDateTime();

    const formattedText =
`🔔 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡

📝 ${text}

👤 ${CREATOR_NAME}
📅 ${dateTime}`;

    const users = await getAllPSIDs(pageAccessToken);

    await sendMessageFn(senderId, { text: 'Sending notifications...' }, pageAccessToken);

    // 🖼️ NOTI AVEC IMAGE
    if (withImage) {
      const cachedImg = imageCache.get(senderId)?.url;

      if (!cachedImg) {
        return sendMessageFn(
          senderId,
          { text: '❌ Please send an image before using "noti img".' },
          pageAccessToken
        );
      }

      // 1️⃣ envoyer texte
      await sendNotification(
        users,
        { text: formattedText },
        pageAccessToken
      );

      // 2️⃣ envoyer image
      await sendNotification(
        users,
        {
          attachment: {
            type: 'image',
            payload: { url: cachedImg }
          }
        },
        pageAccessToken
      );

    } else {
      // 📝 NOTI TEXTE SIMPLE
      await sendNotification(
        users,
        { text: formattedText },
        pageAccessToken
      );
    }

    await sendMessageFn(
      senderId,
      { text: '✅ Notifications sent successfully.' },
      pageAccessToken
    );
  }
};
