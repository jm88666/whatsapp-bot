const puppeteer = require('puppeteer-core'); // of gewoon 'puppeteer'

// Configuratie voor Docker/Linux omgeving
const browser = await puppeteer.launch({
  // Specifiek pad naar system Chromium
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
  
  // Essentiële args voor Docker containers
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ],
  
  // Headless mode (geen GUI)
  headless: true,
  
  // Timeout settings
  timeout: 60000
});
