const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf('TON_BOT_TOKEN'); // remplace TON_BOT_TOKEN par ton token

bot.command('video', async (ctx) => {
  const url = ctx.message.text.split(' ')[1]; // récupère le lien après la commande
  if (!url) return ctx.reply('⚠️ Veuillez fournir un lien YouTube.');

  try {
    const res = await fetch(`https://arychauhann.onrender.com/api/youtubemp4?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!data || !data.other) return ctx.reply('🚨 Impossible de récupérer la vidéo.');

    // Filtre les liens MP4 et audio
    const mp4Links = data.other.filter(o => o.link.includes('mp4'));
    const audioLinks = data.other.filter(o => o.link.includes('audio') || o.link.includes('m4a') || o.link.includes('webm'));

    // Message principal avec titre et miniature
    await ctx.replyWithPhoto(data.thumbnail, {
      caption: `🎬 *${data.title}*\n\n📥 Choisis la qualité à télécharger :`,
      parse_mode: 'Markdown'
    });

    // Boutons MP4
    if (mp4Links.length > 0) {
      await ctx.reply('💻 Vidéo (MP4) :', Markup.inlineKeyboard(
        mp4Links.map(o => Markup.button.url(o.quality, o.link)), { columns: 2 }
      ));
    }

    // Boutons audio
    if (audioLinks.length > 0) {
      await ctx.reply('🎵 Audio :', Markup.inlineKeyboard(
        audioLinks.map(o => Markup.button.url(o.quality, o.link)), { columns: 2 }
      ));
    }

  } catch (err) {
    console.error(err);
    ctx.reply('🚨 Erreur lors de la récupération de la vidéo.');
  }
});

bot.launch();
console.log('Bot démarré...');
