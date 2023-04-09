import { BingChat } from "bing-chat";
import dotenv from "dotenv-safe";
import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";

dotenv.config();

export const bingChat = new BingChat({ cookie: process.env.BING_COOKIE! });

export const bot: Telegraf<Context<Update>> = new Telegraf(
	process.env.TG_TOKEN!,
);

const allowedChatsConfig = process.env.ALLOWED_CHATS!;
export const allowedChats =
	allowedChatsConfig.toLowerCase() === "all"
		? undefined
		: allowedChatsConfig.split(",").map(Number).filter(Boolean);
