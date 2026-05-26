# Use the official Node.js 20 lightweight alpine image
FROM node:20-alpine

# Install openssl (needed for Prisma)
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Автоматический запуск: сначала миграция, потом старт
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
