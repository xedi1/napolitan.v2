# Napolitan Admin Panel - Production Dockerfile

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY admin-panel/nginx.conf /etc/nginx/conf.d/default.conf

# Add labels
LABEL maintainer="Napolitan Team"
LABEL description="Napolitan Restaurant Admin Panel"
LABEL version="1.0.0"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
