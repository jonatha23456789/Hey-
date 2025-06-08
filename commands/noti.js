const { sendMessage } = require('../handles/sendMessage');
const axios = require("axios");
const pageid = '311549272052785';
const kupal = ["8592033747492364"];

async function getAllPSIDs(pageAccessToken) {
  try {
    let psids = [];
    let previous = `https://graph.facebook.com/v21.0/${pageid}/conversations?fields=participants&access_token=${pageAccessToken}`;
    
    while (previous) {
      const response = await axios.get(previous);
      const conversations = response.data.data;

      conversations.forEach(convo => {
        convo.participants.data.forEach(participant => {
          if (participant.id !== pageid && !kupal.includes(participant.id)) {
            psids.push(participant.id);
          }
        });
      });

      previous = response.data.paging.next || null;
    }

    return psids;
  } catch (error) {
    return [];
  }
}

async function sendNotificationToAllUsers(message, pageAccessToken) {
  const users = await getAllPSIDs(pageAccessToken);

  for (const psid of users) {
    try {
      await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
        recipient: { id: psid },
        message: { text: message },
      });
    } catch (error) {
    }
  }
}

module.exports = {
  name: 'noti',
  description: 'send notification to all user',
  author: 'Cliff',
  usage: "sendnoti <message>",
  async execute(senderId, args, pageAccessToken, sendMessage) {

    if (!kupal.some(kupal_ka => kupal_ka === senderId)) {
      sendMessage(senderId, { text: "This command is only for pagebot owner." }, pageAccessToken);
      return;
    }

    const message = args.join(' ');
    if (!message) {
      sendMessage(senderId, { text: 'Please provide a text message' }, pageAccessToken);
      return;
    }

    try {
      sendMessage(senderId, { text: 'Sending notifications...' }, pageAccessToken);
      await sendNotificationToAllUsers(message, pageAccessToken);
      sendMessage(senderId, { text: 'Notifications sent successfully.' }, pageAccessToken);
    } catch (error) {
      sendMessage(senderId, { text: 'An error occurred while sending notifications.' }, pageAccessToken);
      sendMessage(senderId, { text: error.message }, pageAccessToken);
    }
  }
};
