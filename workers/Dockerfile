FROM node:24-bookworm-slim

# Install Chromium & Arabic/Latin fonts for accurate HarfBuzz shaping in PDF exports
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-hosny-amiri \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src

CMD ["node", "--experimental-strip-types", "src/index.ts"]
