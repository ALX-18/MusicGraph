# Frontend MusicGraph — build Vite puis service statique via "vite preview".
FROM node:20-alpine

WORKDIR /app

# Installe les deps en couche cache séparée.
COPY package.json package-lock.json* ./
RUN npm install

# Code source.
COPY . .

# VITE_API_URL est injecté au build (variables VITE_* lues à la compilation).
# Surcharge possible : docker compose passe .env (env_file).
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

EXPOSE 5173
# --host pour écouter hors du conteneur, port 5173 comme docker-compose.
CMD ["npm", "run", "preview"]
