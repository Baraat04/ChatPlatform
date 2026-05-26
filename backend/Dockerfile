FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .

RUN npx prisma generate

EXPOSE 3001

# Самый стабильный вариант
CMD sh -c '
  echo "=== Prisma Migration Start ===" &&
  npx prisma migrate deploy || 
  (echo "⚠️  Baseline needed, accepting data loss..." && 
   npx prisma db push --accept-data-loss) &&
  echo "=== Starting Application ===" &&
  npm start
'
