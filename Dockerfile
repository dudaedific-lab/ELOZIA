FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 FILES_DIRECTORY=/data/files
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && mkdir -p /data/files && chown -R node:node /data /app
COPY --from=build /app/dist ./dist
COPY server ./server
COPY supabase ./supabase
USER node
EXPOSE 3001
CMD ["node", "--use-env-proxy", "server/index.mjs"]
