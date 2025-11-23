# Use Node.js 20 base image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Build Next.js production assets
RUN npm run build

# Expose port
EXPOSE 3000

# Run Next.js production server
CMD ["npm", "run", "start"]
