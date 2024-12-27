FROM node:18-alpine

WORKDIR /app
RUN echo "timeout=60000" > .npmrc

# Just package files to start
COPY package*.json tsconfig.json /app/
COPY frontend/package*.json  /app/frontend/

RUN npm ci
RUN cd /app/frontend/ && npm ci

COPY src/ /app/src/

# Copy everything else
COPY frontend/ /app/frontend/

EXPOSE 3000

# Alternative command is "npm run start:frontend"
CMD npm run start
