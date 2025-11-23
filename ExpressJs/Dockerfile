# Use lightweight Node.js base image
FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install production dependencies
RUN npm install --production && npm cache clean --force

# Copy all project files
COPY . .

# Set port environment variable
ENV PORT=5000

# Expose Express port
EXPOSE 5000

# Run the server
CMD ["node", "server.js"]
