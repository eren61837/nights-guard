FROM node:20-bullseye-slim

WORKDIR /app

# Ses motoru ve gerekli kütüphaneler
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Standart Web / Hugging Face Spaces Portu
ENV PORT=7860
EXPOSE 7860
EXPOSE 3000

CMD ["node", "index.js"]
