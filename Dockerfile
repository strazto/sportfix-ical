FROM node:18-alpine

WORKDIR /app

COPY package*.json tsconfig.json /app/

RUN echo "timeout=60000" > .npmrc
RUN npm ci

COPY src/ /app/src/

EXPOSE 3000

CMD npm run start
