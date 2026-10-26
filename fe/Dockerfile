# ---------- Build ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG PRERENDER_API_URL=
ENV PRERENDER_API_URL=$PRERENDER_API_URL
RUN npm run build

# ---------- Runtime ----------
FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
