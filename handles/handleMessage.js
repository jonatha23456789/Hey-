async function handleMessage(event, pageAccessToken) {
  const senderId = event?.sender?.id;
  if (!senderId) return;

  const messageText = event?.message?.text?.trim();
  if (!messageText) return;

  /* =====================================================
   🎯 PRIORITÉ 1 — REPLY YOUTUBE
  ===================================================== */
  if (event.messageReply && global.youtubeChoices?.[senderId]) {
    const yt = commands.get("youtube");
    if (yt?.reply) {
      console.log("🎯 YouTube reply intercepted");
      return yt.reply(senderId, messageText, pageAccessToken, event);
    }
  }

  /* =====================================================
   🔗 PRIORITÉ 2 — AUTO DOWNLOAD (ALDDL)
  ===================================================== */
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  if (urlRegex.test(messageText)) {
    try {
      console.log("🎬 Auto ALDDL detected → downloading...");
      await alldl.on(senderId, messageText, pageAccessToken);
      return;
    } catch (e) {
      console.error("Auto alldl error:", e.message);
    }
  }

  /* =====================================================
   🌍 PRIORITÉ 3 — AUTO TRANSLATE
  ===================================================== */
  const autoTranslate = commands.get("autotranslate");
  if (autoTranslate?.auto) {
    await autoTranslate.auto(senderId, messageText, pageAccessToken, sendMessage);
  }

  /* =====================================================
   🔥 PRIORITÉ 4 — COMMANDES / AI
  ===================================================== */
  const [commandName, ...args] = messageText.startsWith(prefix)
    ? messageText.slice(prefix.length).split(' ')
    : messageText.split(' ');

  const normalizedCommand = commandName.toLowerCase();

  try {
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
    }
  } catch (err) {
    console.error(err);
    await sendMessage(senderId, { text: "❌ Erreur interne." }, pageAccessToken);
  }
}
