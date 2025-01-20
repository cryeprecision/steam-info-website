FROM node:22-alpine AS builder
WORKDIR /app/

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY ./ ./
RUN pnpm check
RUN pnpm build
RUN pnpm prune --prod

FROM node:22-alpine
WORKDIR /app/

# copy build files
COPY --from=builder /app/build/ ./build/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY package.json pnpm-lock.yaml ./

ENV NODE_ENV=production
CMD ["node", "build"]
