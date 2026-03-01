FROM node:20-alpine

# Install Python and FFmpeg which are required by youtube-dl-exec (yt-dlp)
RUN apk add --no-cache python3 ffmpeg

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# Build Next.js
RUN npm run build

# Expose the listening port
EXPOSE 3000

# Start Next.js standalone server or standard start
CMD ["npm", "run", "start"]
