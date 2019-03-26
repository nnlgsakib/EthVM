docker pull ${client_image}
docker run -e WS_SECRET='${ethstats_secret}' -e WS_SERVER='ws://${ethstats_server}:3030' -e INSTANCE_NAME='mew-instance' -it -p 8546:8546 -p 8545:8545 -p 30303:30303 -v /mnt/ethereum:/root/.local --restart unless-stopped -d ${client_image}