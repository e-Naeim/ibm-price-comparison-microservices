FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js .
COPY utils ./utils
USER node
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
