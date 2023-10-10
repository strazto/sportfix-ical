FROM node:18-alpine

WORKDIR /app

COPY package*.json tsconfig.json /app/
RUN npm ci

COPY src/ /app/src/

EXPOSE 3000

CMD npx ts-node src/index.ts
