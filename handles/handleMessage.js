const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const alldl = require('../commands/alldl');

const commands = new Map();
const prefix = '-';

// Charger toutes les commandes
fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(`../commands/${file}`);
    commands.set(command.name.toLowerCase(), command);
  });

async function handleMessage(event, pageAccessToken) {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim() || "";

  /* =====================================================
     📸 DÉTECTION AUTOMATIQUE IMAGE → AI (SANS TAPER ai)
  ===================================================== */
  if (event.message?.attachments) {
    const photo = event.message.attachments.find(a => a.type === "photo");
    if (photo?.payload?.url) {
      const ai = require("../commands/ai");
      console.log("🖼️ Image détectée → analyse auto");
      await ai.auto(senderId, photo.payload.url, pageAccessToken);
      return; // ⛔ STOP tout le reste
    }
  }

  /* =====================================================
     🌐 AUTO-DOWNLOAD (ALDDL) SI LIEN
  ===================================================== */
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  if (urlRegex.test(messageText)) {
    try {
      console.log("🎬 Auto ALDDL detected → downloading...");
      await alldl.on(senderId, messageText, pageAccessToken);
      return; // ⛔ STOP
    } catch (e) {
      console.error("Auto alldl error:", e.message);
    }
  }

  /* =====================================================
     ✏️ TEXTE NORMAL → AI AUTO (sans prefix)
  ===================================================== */
  if (messageText && !messageText.startsWith(prefix)) {
    const ai = commands.get("ai");
    if (ai && ai.auto) {
      console.log("💬 Texte détecté → AI auto");
      await ai.auto(senderId, "", pageAccessToken, messageText);
      return; // ⛔ STOP
    }
  }

  /* =====================================================
     🌍 AUTO-TRADUCTION
  ===================================================== */
  const autoTranslate = commands.get("autotranslate");
  if (autoTranslate && autoTranslate.auto) {
    await autoTranslate.auto(senderId, messageText, pageAccessToken, sendMessage);
  }

  /* =====================================================
     🔥 SYSTÈME NORMAL DE COMMANDES
  ===================================================== */
  const [commandName, ...args] = messageText
    .slice(prefix.length)
    .split(' ');

  const normalizedCommand = commandName.toLowerCase();

  try {
    console.log(`Received command: ${normalizedCommand}`);

    if (commands.has(normalizedCommand)) {
      await commands.get(normalizedCommand).execute(
        senderId,
        args,
        pageAccessToken,
        event,
        sendMessage
      );
    } else {
      await sendMessage(
        senderId,
        { text: 'Commande inconnue.' },
        pageAccessToken
      );
    }
  } catch (error) {
    console.error("Command error:", error);
    await sendMessage(
      senderId,
      { text: "❌ Erreur lors de l’exécution." },
      pageAccessToken
    );
  }
}

module.exports = { handleMessage };
