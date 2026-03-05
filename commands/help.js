const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'help',
  description: 'Show all available commands',
  usage: 'help [command]',
  author: 'Jonathan',

  execute(senderId, args, pageAccessToken) {

    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

    const commands = commandFiles.map(file => {
      try {
        return require(path.join(commandsDir, file));
      } catch {
        return null;
      }
    }).filter(Boolean);

    // 🔎 help ai
    if (args.length) {

      const name = args[0].toLowerCase();

      const cmd = commands.find(c => c.name?.toLowerCase() === name);

      if (!cmd) {
        return sendMessage(
          senderId,
          { text: `❌ Command "${name}" not found.` },
          pageAccessToken
        );
      }

      return sendMessage(
        senderId,
        {
          text:
`━━━━━━━━━━━━━━
📌 Command: ${cmd.name}

📝 Description:
${cmd.description || 'No description'}

⚙ Usage:
${cmd.usage || 'No usage'}

👤 Author:
${cmd.author || 'Unknown'}
━━━━━━━━━━━━━━`
        },
        pageAccessToken
      );
    }

    // 📜 afficher toutes les commandes
    const list = commands
      .map(cmd => `│ - ${cmd.name}`)
      .join('\n');

    const message =
`━━━━━━━━━━━━━━
🤖 Anime Focus Bot

📜 Available Commands

╭─━━━━━━━━━─╮
${list}
╰─━━━━━━━━━─╯

💡 Type:
help <command>

Example:
help ai
━━━━━━━━━━━━━━`;

    sendMessage(
      senderId,
      { text: message },
      pageAccessToken
    );
  }
};
