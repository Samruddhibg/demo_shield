# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build it
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend and serve the full stack
FROM node:20-alpine
WORKDIR /app/backend

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy the rest of the backend source code
COPY backend/ ./

# Copy the built frontend static files into the backend's public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose the port the app runs on (Render assigns this to process.env.PORT, default 5000)
EXPOSE 5000

# Start the server (Run migrations FIRST, then start Node)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
