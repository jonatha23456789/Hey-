const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const alldl = require('../commands/alldl'); // ✅ Ajout ici

const commands = new Map();
const prefix = '-';

// Charger les commandes
fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(`../commands/${file}`);
    commands.set(command.name.toLowerCase(), command);
  });

async function handleMessage(event, pageAccessToken) {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim();
  if (!messageText) return console.log('Received event without message text');

  // 🌐 AUTO-EXECUTION ALLDL SI MESSAGE CONTIENT UN LIEN
  const urlRegex = /(https?:\/\/[^\s]+)/gi;

  if (urlRegex.test(messageText)) {
    try {
      console.log("🎬 Auto ALDDL detected → downloading...");
      await alldl.on(senderId, messageText, pageAccessToken); // ✅ INTEGRATION PARFAITE
      return; // stop la commande normale
    } catch (e) {
      console.error("Auto alldl error:", e.message);
    }
  }

  // 🌍 AUTO-TRADUCTION
  const autoTranslate = commands.get("autotranslate");
  if (autoTranslate && autoTranslate.auto) {
      await autoTranslate.auto(senderId, messageText, pageAccessToken, sendMessage);
  }

  // ↓ System normal de commandes
  const [commandName, ...args] = messageText.startsWith(prefix)
    ? messageText.slice(prefix.length).split(' ')
    : messageText.split(' ');

  const normalizedCommand = commandName.toLowerCase();

  try {
    console.log(`Received command: ${normalizedCommand}, args: ${args.join(' ')}`);

    if (commands.has(normalizedCommand)) {
      await commands.get(normalizedCommand).execute(
        senderId,
        args,
        pageAccessToken,
        event,
        sendMessage
      );
    } else if (commands.has('ai')) {
      await commands.get('ai').execute(
        senderId,
        [messageText],
        pageAccessToken,
        event,
        sendMessage
      );
    } else {
      await sendMessage(
        senderId,
        { text: 'Unknown command and AI fallback is unavailable.' },
        pageAccessToken
      );
    }
  } catch (error) {
    console.error(`Error executing command:`, error);
    await sendMessage(senderId, {
      text: error.message || 'There was an error executing that command.'
    }, pageAccessToken);
  }
}

module.exports = { handleMessage };
