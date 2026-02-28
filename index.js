const express = require('express');
const { watch } = require('fs/promises');
const { join } = require('path');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
const VERIFY_TOKEN = 'pagebot';
const COMMANDS_PATH = join(__dirname, 'commands');
const GRAPH_API = 'https://graph.facebook.com/v23.0/me';

// ✅ Use environment variable
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// 🔹 Check token
if (!PAGE_ACCESS_TOKEN) {
  console.error("❌ PAGE_ACCESS_TOKEN is not set in environment variables");
  process.exit(1);
}

console.log("✅ PAGE_ACCESS_TOKEN loaded:", PAGE_ACCESS_TOKEN.slice(0, 20) + "...");

app.use(express.json({ limit: '10mb' }));

const apiCall = async (endpoint, data) => {
  const response = await fetch(`${GRAPH_API}${endpoint}?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

const clearMenu = async () => {
  try {
    await fetch(`${GRAPH_API}/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}&fields=persistent_menu,get_started`, {
      method: 'DELETE'
    });
    console.log("✅ Existing menu cleared");
  } catch (e) {
    console.error('⚠️ Menu clear warning:', e.message);
  }
};

const setupMenu = async () => {
  try {
    console.log("🚀 Setting up menu...");
    await clearMenu();

    const menuItems = [{
      type: 'postback',
      title: 'Help',
      payload: 'CMD_HELP'
    }];

    await apiCall('/messenger_profile', {
      get_started: { payload: 'GET_STARTED' },
      persistent_menu: [{
        locale: 'default',
        composer_input_disabled: false,
        call_to_actions: menuItems
      }]
    });

    console.log(`✅ Menu set successfully`);
  } catch (e) {
    console.error('❌ Menu setup failed:', e.message);
    console.error("Make sure your token is valid, app is live, and page is connected.");
  }
};

const startWatcher = async () => {
  try {
    const watcher = watch(COMMANDS_PATH);
    for await (const { eventType, filename } of watcher) {
      if (eventType === 'change' && filename?.endsWith('.js')) {
        setupMenu();
      }
    }
  } catch (e) {
    console.error('Watcher error:', e.message);
  }
};

// Webhook verification
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Webhook messages
app.post('/webhook', (req, res) => {
  if (req.body.object !== 'page') return res.sendStatus(404);

  req.body.entry?.forEach(entry =>
    entry.messaging?.forEach(event => {
      if (event.message) handleMessage(event, PAGE_ACCESS_TOKEN);
      else if (event.postback) handlePostback(event, PAGE_ACCESS_TOKEN);
    })
  );

  res.status(200).send('EVENT_RECEIVED');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await setupMenu();
  startWatcher();
});
