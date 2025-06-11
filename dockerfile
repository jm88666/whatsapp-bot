FROM ghcr.io/puppeteer/puppeteer:21.6.1

# Switch to root to install dependencies
USER root

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Switch back to puppeteer user
USER pptruser

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
