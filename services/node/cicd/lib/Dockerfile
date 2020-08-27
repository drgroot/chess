FROM node:14-alpine AS builder
LABEL maintainer="ali@yusuf.email"

COPY . /

# Install build tool chain
RUN apk update && apk add --no-cache --virtual python make g++
RUN npm install && \
  npm run-script build && \
  rm -rf node_modules src && \
  npm ci --production && \
  npm cache clean --force 

# Create slim app image
FROM node:14-alpine AS app

WORKDIR /app
COPY --from=builder /node_modules node_modules
COPY --from=builder /dist dist
COPY package.json .
COPY package-lock.json .

ENV NODE_ENV production
USER node

# use the node command because NPM doesnt send OS signals to code
CMD ["node","dist/index.js"]
