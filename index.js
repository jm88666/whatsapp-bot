const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

// Express app voor health checks
const app = express();
app.use(express.json());

// Global variables
let qrCodeData = null;
let isReady = false;
let clientStatus = 'Initializing';

// WhatsApp Client configuratie
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "whatsapp-bot"
    }),
    puppeteer: {
        // Gebruik system Chromium in plaats van bundled versie
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ],
        headless: true,
        timeout: 60000
    }
});

// Event listeners voor WhatsApp Client
client.on('qr', (qr) => {
    console.log('QR Code ontvangen!');
    qrCodeData = qr;
    clientStatus = 'QR Code generated';
    
    // Toon QR code in terminal
    qrcode.generate(qr, { small: true });
    console.log('Scan de QR code met je WhatsApp app om in te loggen.');
});

client.on('ready', () => {
    console.log('WhatsApp Web client is klaar!');
    isReady = true;
    clientStatus = 'Ready';
    qrCodeData = null;
});

client.on('authenticated', () => {
    console.log('WhatsApp Web client geauthenticeerd!');
    clientStatus = 'Authenticated';
});

client.on('auth_failure', (msg) => {
    console.error('Authenticatie gefaald:', msg);
    clientStatus = 'Authentication failed';
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Web client disconnected:', reason);
    clientStatus = 'Disconnected';
    isReady = false;
});

// Ontvang berichten
client.on('message', async (message) => {
    console.log(`Bericht ontvangen van ${message.from}: ${message.body}`);
    
    // Basis auto-reply functionaliteit
    if (message.body.toLowerCase() === 'ping') {
        await message.reply('pong');
    }
    
    if (message.body.toLowerCase() === 'hallo') {
        await message.reply('Hallo! Ik ben een WhatsApp bot. Hoe kan ik je helpen?');
    }
    
    if (message.body.toLowerCase() === 'help') {
        await message.reply('Beschikbare commando\'s:\n- ping: krijg pong terug\n- hallo: groet de bot\n- help: toon deze help');
    }
});

// Express routes
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        whatsapp_status: clientStatus,
        ready: isReady,
        timestamp: new Date().toISOString()
    });
});

app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.json({
            qr_code: qrCodeData,
            message: 'Scan deze QR code met WhatsApp'
        });
    } else if (isReady) {
        res.json({
            message: 'Bot is al verbonden met WhatsApp'
        });
    } else {
        res.json({
            message: 'QR code nog niet beschikbaar'
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: clientStatus,
        ready: isReady,
        timestamp: new Date().toISOString()
    });
});

app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(400).json({
            error: 'WhatsApp client is niet klaar'
        });
    }
    
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({
            error: 'Number en message zijn verplicht'
        });
    }
    
    try {
        // Formatteer nummer (voeg @c.us toe als het er niet is)
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        
        await client.sendMessage(chatId, message);
        
        res.json({
            success: true,
            message: 'Bericht verzonden'
        });
    } catch (error) {
        console.error('Fout bij verzenden bericht:', error);
        res.status(500).json({
            error: 'Fout bij verzenden bericht',
            details: error.message
        });
    }
});

// Start Express server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Bot draait op poort ${PORT}`);
});

// Start WhatsApp client
console.log('WhatsApp Web client wordt gestart...');
client.initialize().catch(error => {
    console.error('Fout bij starten WhatsApp client:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Bot wordt afgesloten...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Bot wordt afgesloten...');
    await client.destroy();
    process.exit(0);
});
