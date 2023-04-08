import { bingChat } from "./instances.js";
import { done, firstPos, queue } from "./queue.js";
import { transformBingResponse } from "./transformers.js";
import { ChatMessage } from "bing-chat";
import { Context } from "telegraf";
import { FmtString, bold, fmt } from "telegraf/format";
import { Update } from "typegram";

const chats: Record<
	number,
	{ index: number; res?: ChatMessage; variant?: string }
> = {};

export const variants = ["creative", "balanced", "precise"];
const defaultVariant = "Balanced";

export async function ai(ctx: Context<Update>, prompt: string) {
	try {
		const chatId = ctx.chat!.id;
		chats[chatId] ||= { index: 1 };

		const { pos, turn } = queue();
		if (pos > firstPos) {
			await ctx.reply(fmt`Queued at position: ${bold`${pos}`}`);
			await turn;
		}

		const { message_id } = await ctx.reply(
			fmt`${bold`[${chats[chatId].index++}]`} Running prompt...`,
		);

		const bingRes = await bingChat.sendMessage(
			prompt,
			Object.assign({}, chats[chatId].res, {
				variant: chats[chatId].variant ?? defaultVariant,
			}),
		);
		chats[chatId].res = bingRes;

		let tgRes: FmtString | string;
		if (bingRes.text === prompt) {
			// Bing Chat often replies with the exact prompt
			// in case it's unable to continue the conversation.
			tgRes =
				"Something went wrong. Starting a new chat with /newchat is recommended.";
		} else {
			tgRes = transformBingResponse(bingRes);
		}

		await ctx.telegram.editMessageText(chatId, message_id, undefined, tgRes, {
			disable_web_page_preview: true,
		});
	} catch (e) {
		console.log(e);
		await ctx.reply("Something went wrong!");
	} finally {
		done();
	}
}

export function newChat(chatId: number) {
	delete chats[chatId].res;
	chats[chatId].index = 1;
}

export function getVariant(chatId: number) {
	return chats[chatId]?.variant ?? defaultVariant;
}

export function setVariant(chatId: number, variant: string) {
	chats[chatId] ||= { index: 1 };
	variant = variant.toLowerCase();
	chats[chatId].variant = variant.charAt(0).toUpperCase() + variant.slice(1);
}
