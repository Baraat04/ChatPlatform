# Use the official Node.js 20 lightweight alpine image
FROM node:20-alpine

# Install openssl for Prisma client
RUN apk add --no-cache openssl

# Set the working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the API port
EXPOSE 3001

# Command to wait for DB, push schema, and start the app
CMD npx prisma db push && npm start
