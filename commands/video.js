const { Telegraf } = require("telegraf");
const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");

module.exports = {
    name: "video",
    alias: ["v"],
    category: "media",

    run: async (bot, msg) => {
        const text = msg.message.text.split(" ").slice(1).join(" ");

        if (!text) {
            return bot.telegram.sendMessage(
                msg.chat.id,
                "❌ | Donne un titre de vidéo.\nExemple : `yt naruto opening`"
            );
        }

        const search = await yts(text);
        if (!search.videos || search.videos.length === 0) {
            return bot.telegram.sendMessage(msg.chat.id, "Aucune vidéo trouvée.");
        }

        // Prendre les 10 premières
        const results = search.videos.slice(0, 10);

        // Construire la liste
        let listMessage = "📺 *Résultats YouTube*\n\n";
        results.forEach((video, index) => {
            listMessage += `*${index + 1}.* ${video.title}\n`;
        });

        // envoyer la liste + sauver les résultats en mémoire
        bot.session = bot.session || {};
        bot.session[msg.chat.id] = results;

        bot.telegram.sendMessage(
            msg.chat.id,
            listMessage + "\n🔁 *Réponds avec un numéro pour télécharger la vidéo.*",
            { parse_mode: "Markdown" }
        );
    }
};

// Gestion du reply pour choisir une vidéo
module.exports.reply = async (bot, msg) => {
    if (!msg.message.reply_to_message) return;

    const chatId = msg.chat.id;
    const replyText = msg.message.text.trim();

    // Vérifier si c’est bien un numéro
    if (!/^[0-9]+$/.test(replyText)) return;

    const choice = parseInt(replyText);
    const results = bot.session?.[chatId];

    if (!results || !results[choice - 1]) return;

    const video = results[choice - 1];

    const url = video.url;
    const filePath = `video_${chatId}.mp4`;

    bot.telegram.sendMessage(chatId, "⏳ Téléchargement en cours...");

    ytdl(url, { filter: "videoandaudio", quality: "lowest" })
        .pipe(fs.createWriteStream(filePath))
        .on("finish", async () => {
            await bot.telegram.sendChatAction(chatId, "upload_video");
            await bot.telegram.sendVideo(chatId, { source: filePath });
            fs.unlinkSync(filePath);
        })
        .on("error", (err) => {
            bot.telegram.sendMessage(chatId, "❌ Erreur lors du téléchargement.");
        });
};
