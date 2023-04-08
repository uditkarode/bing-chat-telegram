import { ALLOWED_CHAT_IDS } from "../variables.js";
import { ai, getVariant, newChat, setVariant, variants } from "./ai.js";
import { checkOrigin } from "./check-origin.js";
import { bot } from "./instances.js";
import { message } from "telegraf/filters";
import { useNewReplies } from "telegraf/future";

function args(cmd: string) {
	return cmd.split(" ").splice(1).join(" ");
}

async function main() {
	bot.use(useNewReplies());

	if (typeof ALLOWED_CHAT_IDS != "string") {
		bot.use(checkOrigin(ALLOWED_CHAT_IDS));
	}

	bot.command("ai", async ctx => {
		await ai(ctx, args(ctx.message.text));
	});

	bot.on(message("reply_to_message"), async ctx => {
		if (ctx.message.reply_to_message.from?.id != ctx.botInfo.id) return;

		const reply = ctx.message.reply_to_message;
		const message = ctx.message;
		if ("text" in reply && "text" in message) {
			await ai(ctx, message.text);
		}
	});

	bot.command("newchat", async ctx => {
		newChat(ctx.chat.id);
		await ctx.reply(
			"The previous chat has been cleared. Any new /ai commands will continue a new chat.",
		);
	});

	bot.command("variant", async ctx => {
		const variant = args(ctx.message.text);

		if (!variant)
			return await ctx.reply(
				`Variant for this chat is '${getVariant(ctx.chat.id)}'`,
			);

		if (!variants.includes(variant))
			return await ctx.reply(
				`Invalid variant. Please use /help to learn about valid variants.`,
			);

		setVariant(ctx.chat.id, variant);
		await ctx.reply(`The variant for this chat has been set to '${variant}'`);
	});

	bot.launch();
	console.log("Bot running!");
	console.log("Use ^C to stop");

	// Enable graceful stop
	process.once("SIGINT", () => bot.stop("SIGINT"));
	process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main();
