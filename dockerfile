# Gebruik Node.js 18 slim als basis
FROM node:18-slim

# Stel environment variabelen in
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_BIN=/usr/bin/chromium \
    DEBIAN_FRONTEND=noninteractive

# Update package lists en installeer Chromium + alle benodigde dependencies
RUN apt-get update && apt-get install -y \
    # Chromium browser
    chromium \
    # Basis libraries voor Chromium
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgtk-3-0 \
    libgtk-4-1 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    # Font support
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    # Utilities
    ca-certificates \
    wget \
    gnupg \
    curl \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Maak een non-root user voor veiligheid
RUN groupadd -r botuser && useradd -r -g botuser -G audio,video botuser \
    && mkdir -p /home/botuser/Downloads \
    && mkdir -p /home/botuser/.local-chromium \
    && chown -R botuser:botuser /home/botuser

# Stel werkmap in
WORKDIR /app

# Kopieer package files
COPY package*.json ./

# Installeer Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Kopieer de rest van de applicatie
COPY . .

# Verander eigenaarschap naar botuser
RUN chown -R botuser:botuser /app

# Switch naar non-root user
USER botuser

# Expose poort 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start de applicatie
CMD ["npm", "start"]
