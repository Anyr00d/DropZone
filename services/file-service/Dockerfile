FROM node:lts-alpine3.21
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY ./proto /proto
RUN npm run build
CMD ["node", "dist/index.js"]