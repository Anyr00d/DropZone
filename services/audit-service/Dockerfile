FROM node:lts-alpine3.21
WORKDIR /app
COPY package*.json ./
EXPOSE 3000
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]