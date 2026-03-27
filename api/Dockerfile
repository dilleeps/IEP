############################
# 1) deps stage (cached)
############################
FROM node:23-alpine AS deps
WORKDIR /app

# Needed by some native deps if they ever appear (safe default)
RUN apk add --no-cache libc6-compat

# Copy only package metadata first for better caching
COPY package*.json ./

# Install prod+dev deps for build stage (cached)

RUN npm ci


############################
# 2) build stage
############################
FROM node:23-alpine AS build
WORKDIR /app

RUN apk add --no-cache libc6-compat

# bring node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# copy package files and source
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# build
RUN npm run build

# Compile migration files separately (excluded from main tsconfig due to legacy type errors)
RUN npx tsc --outDir dist --rootDir src --module NodeNext --moduleResolution NodeNext \
    --target ES2022 --esModuleInterop --skipLibCheck --noCheck \
    src/db/migrations/*.ts \
    && cp src/db/migrations/*.json dist/db/migrations/ 2>/dev/null || true

# prune to production deps only (smaller runtime)
RUN npm prune --omit=dev

############################
# 3) runtime stage (small)
############################
FROM node:23-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: run as non-root
RUN addgroup -S app && adduser -S app -G app

# Copy only what we need at runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

USER app

# Cloud Run uses PORT environment variable (default 8080)
# But we'll keep EXPOSE 3000 for local development compatibility
EXPOSE 8080

# If you use OTLP gRPC collector, typically 4317
# ENV OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=grpc://otel-collector:4317
# ENV OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=grpc://otel-collector:4317
# ENV OTEL_SERVICE_NAME=express-sequelize-api

# Start compiled server (which starts OTel before app)
CMD ["node", "dist/server.js"]
