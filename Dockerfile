# Node 22+ for the built-in node:sqlite. No dependencies to install, so there
# is no build stage and nothing to compile.
FROM node:22-slim

ENV NODE_ENV=production PORT=4000
WORKDIR /app

# Only what the server needs at runtime.
COPY package.json ./
COPY server ./server
COPY src ./src
COPY assets ./assets
COPY index.html privacy.html terms.html robots.txt site.webmanifest ./
# sitemap.xml is the URL robots.txt advertises, and sw.js is what makes the
# app open offline. Left out of the image, the first 404s and the second
# quietly turns the install into an ordinary bookmark.
COPY sitemap.xml sw.js ./

# The database lives on a volume, not in the image.
RUN mkdir -p /app/server/data && chown -R node:node /app
VOLUME ["/app/server/data"]
USER node

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run it directly so SIGTERM reaches the process and shutdown is graceful.
CMD ["node", "server/app.js"]
