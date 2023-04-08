import { BING_COOKIE, TG_TOKEN } from "../variables.js";
import { BingChat } from "bing-chat";
import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";

export const bingChat = new BingChat({
	cookie: BING_COOKIE.replaceAll('"', "").trim(),
});

export const bot: Telegraf<Context<Update>> = new Telegraf(TG_TOKEN.trim());
