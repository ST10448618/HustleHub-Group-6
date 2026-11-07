FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./

RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS certs
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /certs
RUN openssl req -x509 -newkey rsa:2048 -nodes \
      -keyout key.pem -out cert.pem -days 365 \
      -subj "/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,DNS:backend,IP:127.0.0.1"

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg \
      /opt/yarn-*

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json server.js ./
COPY --chown=node:node src ./src
COPY --from=certs --chown=node:node /certs ./certificates

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "require('https').get({host:'127.0.0.1',port:5000,path:'/health',rejectUnauthorized:false},(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]

CMD ["node", "server.js"]