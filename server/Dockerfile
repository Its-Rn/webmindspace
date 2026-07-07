FROM node:22-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS server-builder
WORKDIR /server
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=client-builder /client/dist ./client/dist
COPY --from=server-builder /server/node_modules ./node_modules
COPY server/src ./src
COPY server/package.json .
EXPOSE 5000
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
