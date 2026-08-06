FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base

ARG NPM_VERSION=11.17.0
RUN npm install --global "npm@${NPM_VERSION}"

FROM base AS development

WORKDIR /workspace

FROM base AS build

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM base AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json .npmrc ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server.js server-utils.js security-headers.js runtime-config.js server-logger.js ./

RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3000
CMD ["node", "server.js"]
