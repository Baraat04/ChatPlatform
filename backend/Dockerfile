FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .

RUN npx prisma generate

EXPOSE 3001

# Автоматический baseline + миграции + запуск
CMD ["sh", "-c", "
  echo '=== Starting Prisma Setup ===' && 
  mkdir -p prisma/migrations/0_init && 
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql 2>/dev/null  true && 
  npx prisma migrate resolve --applied 0_init 2>/dev/null  true && 
  echo '=== Applying Migrations ===' && 
  npx prisma migrate deploy && 
  echo '=== Starting Application ===' && 
  npm start
"]
