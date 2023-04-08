# Bing Chat Telegram Bot

A Telegram bot that lets you interact with the Bing AI from chats that you allow in the config.

**> To start using this project,**

* Run `yarn install` to install the dependencies.
* Copy `variables.example.ts` to `variables.ts`, go through it, and add the required information.
* Run `yarn dev` or `yarn build && yarn start` to start the bot.

**> To start using this project using Docker,**

* Run `docker compose -f .build/docker-compose.yml build` to build the container
* Copy `variables.example.ts` to `variables.ts`, go through it, and add the required information.
* Run `docker compose up -d` to start the bot.

**> To enable Telegram command autocompletion,**
* Press the `Edit Commands` button in your bot's menu on BotFather, and paste the following:
```
ai - send a prompt to the AI
variant - get or set the variant of the chat
help - get help on how to use the bot
```
