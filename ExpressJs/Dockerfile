# ExpressJs/Dockerfile

# Use lightweight Node.js base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all project files
COPY . .

# Expose the Express port
EXPOSE 5000

# Run the server
CMD ["node", "server.js"]
