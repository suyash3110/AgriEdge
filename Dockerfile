FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run db:generate && npm run build
RUN node scripts/build-worker.mjs
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN groupadd --system agriedge && useradd --system --gid agriedge agriedge
COPY --from=build --chown=agriedge:agriedge /app/.next/standalone ./
COPY --from=build --chown=agriedge:agriedge /app/.next/static ./.next/static
COPY --from=build --chown=agriedge:agriedge /app/public ./public
COPY --from=build --chown=agriedge:agriedge /app/prisma ./prisma
COPY --from=build --chown=agriedge:agriedge /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=agriedge:agriedge /app/fixtures ./fixtures
COPY --from=build --chown=agriedge:agriedge /app/node_modules ./node_modules
COPY --from=build --chown=agriedge:agriedge /app/dist ./dist
RUN mkdir -p work && chown agriedge:agriedge work
USER agriedge
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server.js"]

