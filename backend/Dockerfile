FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .

RUN npx prisma generate

EXPOSE 3001

# Автоматический запуск с обработкой baseline
CMD ["sh", "-c", "
  echo '=== Starting Prisma Migration Check ===' && 
  if [ ! -d 'prisma/migrations' ]  [ -z \"$(ls prisma/migrations 2>/dev/null)\" ]; then
    echo 'No migrations found. Creating baseline...' && 
    npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql  true &&
    npx prisma migrate resolve --applied 0_init || true
  fi && 
  echo 'Applying migrations...' && 
  npx prisma migrate deploy && 
  echo 'Starting application...' && 
  npm start
"]
