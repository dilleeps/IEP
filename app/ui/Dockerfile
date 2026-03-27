# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files first (changes least frequently)
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code (changes more frequently)
COPY . .

# Define build arguments for Vite environment variables
# Place after COPY to avoid cache invalidation when env vars change
ARG VITE_BASE_API_URL
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_STRIPE_PUBLISHABLE_KEY

# Make ARGs available as ENV only when they have values
# When ARGs are empty, Vite falls back to .env.production file
RUN if [ -n "$VITE_BASE_API_URL" ]; then \
      echo "VITE_BASE_API_URL=$VITE_BASE_API_URL" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_RECAPTCHA_SITE_KEY" ]; then \
      echo "VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_API_KEY" ]; then \
      echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_AUTH_DOMAIN" ]; then \
      echo "VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_PROJECT_ID" ]; then \
      echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_STORAGE_BUCKET" ]; then \
      echo "VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then \
      echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_APP_ID" ]; then \
      echo "VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_FIREBASE_MEASUREMENT_ID" ]; then \
      echo "VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID" >> /tmp/vite-env; \
    fi && \
    if [ -n "$VITE_STRIPE_PUBLISHABLE_KEY" ]; then \
      echo "VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY" >> /tmp/vite-env; \
    fi && \
    if [ -f /tmp/vite-env ]; then \
      echo "Using Docker ARG values for Vite env:" && cat /tmp/vite-env && \
      cp /tmp/vite-env .env.local; \
    else \
      echo "No Docker ARGs provided, using .env.production for Vite config"; \
    fi

# Build the application
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
