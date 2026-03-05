const fs = require('fs');
     2	const path = require('path');
     3	const { sendMessage } = require('../handles/sendMessage');
     4	
     5	const prefix = '-';
     6	
     7	const commandCategories = {
     8	  ai: '📖 | 𝙴𝚍𝚞𝚌𝚊𝚝𝚒𝚘𝚗',
     9	  imagegen: '🖼 | 𝙸𝚖𝚊𝚐𝚎',
    10	  pinterest: '🖼 | 𝙸𝚖𝚊𝚐𝚎',
    11	  lyrics: '🎧 | 𝙼𝚞𝚜𝚒𝚌',
    12	  help: '👥 | 𝙾𝚝𝚑𝚎𝚛𝚜'
    13	};
    14	
    15	const defaultCategory = '👥 | 𝙾𝚝𝚑𝚎𝚛𝚜';
    16	
    17	function normalizeNames(nameField) {
    18	  if (Array.isArray(nameField)) return nameField.filter(Boolean).map(name => String(name).toLowerCase());
    19	  if (typeof nameField === 'string' && nameField.trim()) return [nameField.toLowerCase()];
    20	  return [];
    21	}
    22	
    23	module.exports = {
    24	  name: 'help',
    25	  description: 'Show available commands',
    26	  usage: '-help\n-help [command name]',
    27	  author: 'Coffee',
    28	
    29	  execute(senderId, args, pageAccessToken) {
    30	    const commandsDir = path.join(__dirname, '../commands');
    31	    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    32	
    33	    const commands = commandFiles
    34	      .map(file => {
    35	        try {
    36	          return require(path.join(commandsDir, file));
    37	        } catch {
    38	          return null;
    39	        }
    40	      })
    41	      .filter(command => command && normalizeNames(command.name).length > 0)
    42	      .map(command => {
    43	        const names = normalizeNames(command.name);
    44	        return {
    45	          ...command,
    46	          names,
    47	          primaryName: names[0]
    48	        };
    49	      })
    50	      .sort((a, b) => a.primaryName.localeCompare(b.primaryName));
    51	
    52	    if (args.length) {
    53	      const name = args[0].toLowerCase();
    54	      const command = commands.find(cmd => cmd.names.includes(name));
    55	
    56	      return sendMessage(
    57	        senderId,
    58	        {
    59	          text: command
    60	            ? `━━━━━━━━━━━━━━\n𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝙽𝚊𝚖𝚎: ${command.primaryName}\n𝙰𝚕𝚒𝚊𝚜𝚎𝚜: ${command.names.map(cmdName => `${prefix}${cmdName}`).join(', ')}\n𝙳𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗: ${command.description || 'No description provided.'}\n𝚄𝚜𝚊𝚐𝚎: ${command.usage || `Use ${prefix}${command.primaryName}`}\n━━━━━━━━━━━━━━`
    61	            : `Command "${name}" not found.`
    62	        },
    63	        pageAccessToken
    64	      );
    65	    }
    66	
    67	    const grouped = commands.reduce((groups, command) => {
    68	      const category = commandCategories[command.primaryName] || defaultCategory;
    69	      if (!groups[category]) groups[category] = [];
    70	
    71	      command.names.forEach(name => {
    72	        groups[category].push(`${prefix}${name}`);
    73	      });
    74	
    75	      return groups;
    76	    }, {});
    77	
    78	    const categorizedMessage = Object.entries(grouped)
    79	      .map(([category, names]) => {
    80	        const listed = [...new Set(names)].sort().map(name => `│ - ${name}`).join('\n');
    81	        return `╭─╼━━━━━━━━╾─╮\n│ ${category}\n${listed}\n╰─━━━━━━━━━╾─╯`;
    82	      })
    83	      .join('\n');
    84	
    85	    return sendMessage(
    86	      senderId,
    87	      {
    88	        text: `━━━━━━━━━━━━━━\n𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜 (${commands.length}):\n${categorizedMessage}\nType: ${prefix}help [command name]\nfor command details.\n━━━━━━━━━━━━━━`
    89	      },
    90	      pageAccessToken
    91	    );
    92	  }
    93	};
