import { Context, Middleware } from "telegraf";

export const checkOrigin =
	(allowedIds: readonly number[] | number[]): Middleware<Context> =>
	(ctx, next) => {
		const chatId = ctx.chat?.id;
		if (chatId && allowedIds.includes(chatId)) next();
		else ctx.reply("Unable to proceed in this chat!");
	};
