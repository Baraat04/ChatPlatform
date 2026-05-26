FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "set -e; echo '=== Prisma Migration Start ==='; npx prisma migrate deploy; echo '=== Starting Application ==='; exec npm start"]
