const axios = require('axios');

let cachedManga = []; // Stocke les mangas de la dernière recherche

module.exports = {
    name: 'manga',
    description: 'Recherche et lecture de mangas',

    async execute(event, args, sendMessage) {
        const userId = event.sender?.id || event.userId || event.chat?.id;
        if (!userId) {
            console.error('Impossible de récupérer l\'ID de l\'utilisateur !', event);
            return;
        }

        if (!args || args.length === 0) {
            await sendMessage(userId, 'Utilisation : !manga <titre> ou !manga lire <numéro>');
            return;
        }

        const command = args[0].toLowerCase();

        if (command === 'lire') {
            const index = parseInt(args[1], 10) - 1;
            if (isNaN(index) || index < 0 || index >= cachedManga.length) {
                await sendMessage(userId, 'Numéro de manga invalide.');
                return;
            }

            const manga = cachedManga[index];

            // Envoi du manga avec sa cover
            await sendMessage(userId, `Lecture du manga : ${manga.title}`);
            await sendMessage(userId, { attachment: { type: 'image', payload: { url: manga.cover } } });

        } else {
            // Recherche d’un manga via l'API Miko
            const title = args.join(' ');
            try {
                const response = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(title)}`);
                const data = response.data;

                if (!data.status || !data.data.results || data.data.results.length === 0) {
                    await sendMessage(userId, `Aucun manga trouvé pour "${title}".`);
                    return;
                }

                // Stocke tous les mangas trouvés
                cachedManga = data.data.results.map(m => ({
                    id: m.id,
                    title: m.title,
                    cover: m.cover
                }));

                let message = `Mangas trouvés pour "${title}" :\n`;
                cachedManga.forEach((m, i) => {
                    message += `${i + 1}. ${m.title}\n`;
                });
                message += '\nRépondez avec !manga lire <numéro> pour voir la cover du manga choisi.';

                await sendMessage(userId, message);

            } catch (error) {
                console.error('Erreur lors de la recherche du manga :', error.message);
                await sendMessage(userId, 'Erreur lors de la recherche du manga.');
            }
        }
    }
};
