# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @hello-pipeline/api && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist

# Set by the pipeline to the commit SHA, shown by GET /api/version.
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "apps/api/dist/server.js"]
