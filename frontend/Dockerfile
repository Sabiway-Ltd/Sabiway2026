# Use Node.js 20 base image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy rest of the project
COPY . .

# Build Next.js production assets with Webpack (disable Turbopack)
RUN npm run build --no-turbopack

# Expose port
EXPOSE 3000

# Run Next.js production server
CMD ["npm", "run", "start"]
