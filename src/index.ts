import { bold, code, fmt, underline } from "telegraf/format";
import { ai, getVariant, newChat, setVariant, variants } from "./ai.js";
import { checkOrigin } from "./check-origin.js";
import { message } from "telegraf/filters";
import { useNewReplies } from "telegraf/future";
import { allowedChats, bot } from "./config.js";

async function main() {
	bot.use(useNewReplies());

	if (allowedChats) {
		console.log("Usage allowed in chats: ");
		console.log(allowedChats);
		bot.use(checkOrigin(allowedChats));
	} else {
		console.log("Usage allowed in all chats");
	}

	bot.command("ai", async ctx => ai(ctx, args(ctx.message.text)));

	bot.on(message("reply_to_message"), async ctx => {
		if (ctx.message.reply_to_message.from?.id != ctx.botInfo.id) return;

		const reply = ctx.message.reply_to_message;
		const message = ctx.message;
		if ("text" in reply && "text" in message && message.text.startsWith(".")) {
			ai(ctx, message.text.slice(1).trim());
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

	bot.command("help", async ctx => {
		await ctx.reply(
			fmt`• ${underline(bold`Prompting the bot`)}
To prompt the AI, you can either use the ${code`/ai`} command with a prompt, such as:
${code`/ai what is the radius of the earth`}

...or reply to a message from the bot with a message starting with a period, for example ". hello". In both cases, the same conversation will be carried forward (i.e. the bot will retain context of previous messages).

• ${underline(bold`Starting a new conversation`)}
You can use /newchat to start a new conversation. By doing this, the bot will effectively 'lose memories' of the messages sent to it since the last /newchat.

The bot will prompt you to do this if a conversation cannot be continued any further.

• ${underline(bold`Setting or getting the variant`)}
Variants are applied on a chat-wide basis. You can get the bot variant using the /variant command with no arguments.

Use '${code`/variant <variant>`}' to set the bot variant. Valid variants are:
‣ ${bold("Balanced")} (default): informative and friendly
‣ ${bold("Creative")}: original and imaginative
‣ ${bold("Precise")}: concise and straightforward

The variant command accepts the name of any of these 3 variants in a case-insensitive format.`,
		);
	});

	bot.catch(err => {
		console.log("[global] caught error:");
		console.log(err);
	});

	bot.launch();
	console.log("Bot running!");
	console.log("Use ^C to stop");

	// Enable graceful stop
	process.once("SIGINT", () => bot.stop("SIGINT"));
	process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

function args(cmd: string) {
	return cmd.split(" ").splice(1).join(" ");
}

main();
