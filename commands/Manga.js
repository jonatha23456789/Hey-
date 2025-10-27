const axios = require('axios');

let cachedManga = []; // stocke les mangas de la dernière recherche
let cachedChapters = []; // stocke les chapitres du manga choisi

module.exports = {
    name: 'manga',
    description: 'Recherche et lecture de mangas',

    async execute(event, args, sendMessage) {
        // Récupération sécurisée de l'ID de l'utilisateur
        const userId = event.sender?.id || event.userId || event.chat?.id;
        if (!userId) {
            console.error('Impossible de récupérer l\'ID de l\'utilisateur !', event);
            return;
        }

        if (!args || args.length === 0) {
            await sendMessage(userId, 'Utilisation : !manga <titre> ou !manga chap <numéro>');
            return;
        }

        const command = args[0].toLowerCase();

        if (command === 'chap') {
            // Affichage des chapitres d’un manga choisi
            const index = parseInt(args[1], 10) - 1;
            if (isNaN(index) || index < 0 || index >= cachedChapters.length) {
                await sendMessage(userId, 'Numéro de chapitre invalide.');
                return;
            }

            const chapter = cachedChapters[index];
            let message = `Chapitre ${chapter.chapterNumber} : ${chapter.title}\n`;
            message += `Lien de lecture : ${chapter.url}`;

            await sendMessage(userId, message);

        } else {
            // Recherche d’un manga
            const title = args.join(' ');
            try {
                const response = await axios.get(`https://miko-utilis.vercel.app/api/manga-search?search=${encodeURIComponent(title)}`);
                const data = response.data;

                if (!data.status || !data.data.results || data.data.results.length === 0) {
                    await sendMessage(userId, `Aucun manga trouvé pour "${title}".`);
                    return;
                }

                cachedManga = data.data.results;
                let message = 'Mangas trouvés :\n';
                cachedManga.forEach((m, i) => {
                    message += `${i + 1}. ${m.title}\n`;
                });

                message += '\nRépondez avec !manga chap <numéro> pour voir les chapitres du manga choisi.';
                await sendMessage(userId, message);

                // On peut préremplir les chapitres pour le premier manga (optionnel)
                cachedChapters = cachedManga.map((m, i) => ({
                    chapterNumber: i + 1,
                    title: m.title,
                    url: m.cover // ici on met l'image comme lien de lecture par défaut
                }));

            } catch (error) {
                console.error('Erreur lors de la recherche du manga :', error.message);
                await sendMessage(userId, 'Erreur lors de la recherche du manga.');
            }
        }
    }
};
