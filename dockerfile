# Gebaseerd op Node 18 met alle nodige libs voor Puppeteer
FROM ghcr.io/puppeteer/puppeteer:latest

# Werkmap maken
WORKDIR /app

# Kopieer dependency files
COPY package*.json ./

# Installeer afhankelijkheden
RUN npm install

# Kopieer alle bestanden
COPY . .

# Expose poort
EXPOSE 8080

# Start de bot
CMD [ "npm", "start" ]
