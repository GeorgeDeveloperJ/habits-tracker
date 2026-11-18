FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://dummy" npx prisma generate

RUN npm run build


FROM builder AS release-tools
ENV PATH=/app/node_modules/.bin:$PATH
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM builder AS runtime-dependencies
RUN npm prune --omit=dev --legacy-peer-deps --ignore-scripts --no-audit

FROM node:24-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

COPY --from=runtime-dependencies /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/ready').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]