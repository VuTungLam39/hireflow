# ---------- Build ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- Runtime ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
# Chạy migration rồi khởi động server
CMD ["sh", "-c", "npx typeorm migration:run -d dist/database/data-source.js && node dist/main.js"]
