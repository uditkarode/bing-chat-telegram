import { BingChat } from "bing-chat";
import dotenv from "dotenv-safe";
import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";

dotenv.config();

const bingCookieConfig = process.env.BING_COOKIE!.trim().replace(/['"]/g, "");
export const bingChat = new BingChat({
	cookie: bingCookieConfig.includes(";")
		? // this is the entire `document.cookie`
		  (bingCookieConfig
				.split(";")
				.map(text => text.split("="))
				.find(entry => entry[0] === " _U" || entry[0] === "_U") ?? [])[1] ??
		  bingCookieConfig
		: // this is the _U cookie
		  bingCookieConfig,
});

export const bot: Telegraf<Context<Update>> = new Telegraf(
	process.env.TG_TOKEN!,
);

const allowedChatsConfig = process.env.ALLOWED_CHATS!;
export const allowedChats =
	allowedChatsConfig.toLowerCase() === "all"
		? undefined
		: allowedChatsConfig.split(",").map(Number).filter(Boolean);
