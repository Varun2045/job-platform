# Stage 1: Build the backend and frontend
FROM node:22 AS builder
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

# Stage 2: Runtime image with Playwright and Chromium pre-installed
FROM mcr.microsoft.com/playwright:v1.44.1-jammy AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860

# Copy built outputs and dependencies from builder
COPY package*.json tsconfig.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY resumes ./resumes

# Create storage and logs folders and ensure write permissions for non-root user 1000 (Hugging Face default)
RUN mkdir -p storage logs && chmod -R 777 storage logs

EXPOSE 7860
CMD ["node", "dist/core/server.js"]
