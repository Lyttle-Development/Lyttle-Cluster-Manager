# Use an official Node.js runtime as a parent image
FROM node:22.11.0

# Install Docker CLI and curl
RUN apt-get update \
  && apt-get install -y docker.io curl \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install dependencies using npm ci
RUN npm ci

# Build the application
RUN npm run docker:setup

# Expose the port the app runs on
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]

# Add a health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1