FROM node:18.15.0-alpine3.17


# Set build shell to bash, default has has some issues sometimes
#SHELL ["/bin/bash", "-c"]


WORKDIR /root
COPY . .

RUN yarn install \
 && yarn build \
 && rm -rf /usr/local/share/.cache

CMD yarn start
