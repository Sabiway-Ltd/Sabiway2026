# frontend/Dockerfile

# Use an official Node.js image
FROM node:20-alpine AS builder
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all app files
COPY . .

# Build the Next.js app
RUN npm run build

# Run the production server
FROM node:20-alpine AS runner
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose the port and start the app
EXPOSE 3000
CMD ["npm", "start"]
