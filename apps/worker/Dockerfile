FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package.json files and install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY libs/types/package.json ./libs/types/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/worker ./apps/worker
COPY libs/types ./libs/types
COPY tsconfig.json ./

# Build the app
RUN pnpm --filter=@task/worker build

# Production stage
FROM node:20-slim AS runner

# Set working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the app
CMD ["node", "dist/index.js"]
