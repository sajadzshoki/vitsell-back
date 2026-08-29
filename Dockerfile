# Digishop API — AdonisJS 7
FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chmod +x docker/entrypoint.sh

EXPOSE 3333

ENTRYPOINT ["sh", "./docker/entrypoint.sh"]
