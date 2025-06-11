const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Scan de QR-code met WhatsApp Web om in te loggen');
});

client.on('ready', () => console.log('WhatsApp bot is klaar!'));
client.on('auth_failure', msg => console.error('Auth failed:', msg));

client.initialize();

app.post('/send', async (req, res) => {
  try {
    const { groupName, message } = req.body;
    if (!groupName || !message) return res.status(400).json({ error: 'groupName en message verplicht' });
    
    const chats = await client.getChats();
    const group = chats.find(c => c.isGroup && c.name.toLowerCase().includes(groupName.toLowerCase()));
    if (!group) return res.status(404).json({ error: `Groep ${groupName} niet gevonden` });
    
    await client.sendMessage(group.id._serialized, message);
    res.json({ success: true, message: `Bericht naar ${group.name}` });
  } catch (error) {
    res.status(500).json({ error: 'Fout bij versturen' });
  }
});

app.listen(port, () => console.log(`Bot draait op poort ${port}`));
