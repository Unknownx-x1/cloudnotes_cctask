# ==============================================================================
# Multi-Stage Dockerfile for CloudNotes
# ==============================================================================
# Stage 1: Build Stage
# Compiles the React frontend (Vite) and the Node.js API server (esbuild)
# ==============================================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Enable corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace package manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/cloudnotes/package.json ./artifacts/cloudnotes/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY scripts/package.json ./scripts/
COPY lib/ ./lib/

# Install dependencies
RUN pnpm install

# Copy source files
COPY tsconfig.base.json tsconfig.json ./
COPY artifacts/ ./artifacts/
COPY scripts/ ./scripts/

# Build the React frontend and Express backend bundles
RUN pnpm run build

# ==============================================================================
# Stage 2: Production Runtime Stage
# Minimal, secure container image containing only runtime files & assets
# ==============================================================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/notes.db

# Create data directory for persistent SQLite database and set permissions
RUN mkdir -p /data && chown -R node:node /data /app

# Copy compiled backend bundle from builder
COPY --from=builder --chown=node:node /app/artifacts/api-server/dist ./dist

# Copy compiled frontend assets from builder into public directory
COPY --from=builder --chown=node:node /app/artifacts/cloudnotes/dist/public ./public

# Use standard non-root user for security best practices
USER node

# Expose web port
EXPOSE 3000

# Container healthcheck: pings the API every 30 seconds
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/notes').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start unified server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
