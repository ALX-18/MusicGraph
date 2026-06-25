FROM node:20-alpine

WORKDIR /app

# Install deps first (meilleur cache Docker)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copie du code
COPY . .

EXPOSE 4000

# Healthcheck applicatif : interroge /api/health
HEALTHCHECK --interval=10s --timeout=5s --retries=10 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "src/server.js"]
