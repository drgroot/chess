#!/usr/bin/env bash

docker run -d --link=rabbitmq --link=mongo -e MONGOURL_READ="$MONGOURL_READ" -e MONGODB=$MONGO -e RABBITMQ=$RABBIT --name dbapi yusufali/chess_dbapi || true