FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN npm run build


FROM node:24-alpine AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/package.json ./

COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/scripts/entrypoint.sh ./entrypoint.sh

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

CMD [ "./entrypoint.sh" ]