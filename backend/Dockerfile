FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .

RUN npx prisma generate

EXPOSE 3001

# Автоматические миграции + запуск
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
