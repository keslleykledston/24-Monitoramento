# Base image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json for dependencies installation
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

CMD ["npm", "start"]