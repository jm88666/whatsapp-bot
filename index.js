const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// WhatsApp client met Puppeteer configuratie voor Docker
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Scan de QR-code met WhatsApp Web om in te loggen');
});

client.on('ready', () => console.log('WhatsApp bot is klaar!'));
client.on('auth_failure', msg => console.error('Auth failed:', msg));
client.on('disconnected', (reason) => console.log('Disconnected:', reason));

client.initialize();

app.post('/send', async (req, res) => {
  try {
    const { groupName, message } = req.body;
    if (!groupName || !message) {
      return res.status(400).json({ error: 'groupName en message verplicht' });
    }
    
    const chats = await client.getChats();
    const group = chats.find(c => c.isGroup && c.name.toLowerCase().includes(groupName.toLowerCase()));
    
    if (!group) {
      return res.status(404).json({ error: `Groep ${groupName} niet gevonden` });
    }
    
    await client.sendMessage(group.id._serialized, message);
    res.json({ success: true, message: `Bericht naar ${group.name}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Fout bij versturen' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', ready: client.info ? true : false });
});

app.listen(port, () => console.log(`Bot draait op poort ${port}`));
