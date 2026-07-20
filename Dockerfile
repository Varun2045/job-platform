# Stage 1: Build the backend and frontend
FROM node:22-alpine AS builder
WORKDIR /app

# Copy configuration files and dependencies descriptors
COPY package*.json tsconfig.json ./
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm ci

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy source code
WORKDIR /app
COPY src ./src
COPY config ./config
COPY frontend ./frontend

# Compile TypeScript backend
RUN npm run build

# Compile Vite frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Runtime image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built outputs and dependencies
COPY package*.json tsconfig.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3001
CMD ["node", "dist/core/server.js"]
