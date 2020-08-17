#!/usr/bin/env bash

docker run -d -p "5672:5672" --name rabbitmq rabbitmq || true
docker run -d -p "27017:27017" --name mongo mongo || true
sleep 30