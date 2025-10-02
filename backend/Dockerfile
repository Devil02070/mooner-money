FROM node:22-alpine AS base

FROM base AS builder
RUN apk add --no-cache gcompat
WORKDIR /app

# Copy package files first
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy prisma directory
COPY prisma ./prisma

# Generate Prisma client (now that schema.prisma is available)
RUN npx prisma generate

# Debug: List what's in node_modules/.prisma to verify generation
RUN ls -la node_modules/.prisma/ || echo "Prisma client not found in node_modules/.prisma"

# Copy source code and build
COPY src ./src
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copy built app, node_modules, and generated Prisma client
COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

# Copy the generated Prisma client (important!)
COPY --from=builder --chown=hono:nodejs /app/prisma /app/prisma

USER hono
EXPOSE $PORT

CMD ["node", "/app/dist/index.js"]