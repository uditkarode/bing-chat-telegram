FROM node:20-alpine3.16


# Set build shell to bash, default has has some issues sometimes
#SHELL ["/bin/bash", "-c"]


WORKDIR /root
COPY . .

RUN yarn install \
 && yarn build \
 && rm -rf /usr/local/share/.cache

CMD yarn start
