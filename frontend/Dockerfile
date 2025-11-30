# Use Node.js 20 base image
FROM node:20-alpine

# Install build dependencies for any native modules (optional, safer)
RUN apk add --no-cache bash git python3 make g++ cairo-dev pango-dev giflib-dev

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the project
COPY . .

# Disable Turbopack for Docker build
ENV NEXT_PRIVATE_TURBOPACK=0

# Build Next.js production assets with Webpack
RUN npm run build

# Expose port
EXPOSE 3000

# Run Next.js production server
CMD ["npm", "run", "start"]
