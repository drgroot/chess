FROM node:14-alpine AS builder
LABEL maintainer="ali@yusuf.email"

COPY . /

# Install build tool chain
RUN apk update && apk add --no-cache --virtual python make g++
RUN npm config set unsafe-perm true && \
  npm install && \
  npm run-script build && \
  rm -rf node_modules src && \
  npm install --only=prod

# Create slim app image
FROM node:14-alpine AS app

WORKDIR /app
COPY --from=builder /node_modules node_modules
COPY --from=builder /dist dist
COPY package.json .
COPY package-lock.json .

ENV NODE_ENV production
USER node
CMD ["npm","start","--unhandled-rejections=strict"]
