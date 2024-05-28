FROM node:22-alpine AS builder
WORKDIR /app/

COPY package.json package-lock.json ./
RUN npm ci

COPY ./ ./
RUN npm run check
RUN npm run build
RUN npm prune --production

FROM node:22-alpine
WORKDIR /app/

# copy build files
COPY --from=builder /app/build/ build/
COPY --from=builder /app/node_modules/ node_modules/
COPY package.json ./

ENV NODE_ENV=production
CMD ["node", "build"]
