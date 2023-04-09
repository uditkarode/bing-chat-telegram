import { done, firstPos, queue } from "./queue.js";
import { transformBingResponse } from "./transformers.js";
import { ChatMessage } from "bing-chat";
import { Context } from "telegraf";
import { bold, fmt } from "telegraf/format";
import { Update } from "typegram";
import { bingChat } from "./config.js";
import pTimeout from "p-timeout";
import { Message } from "telegraf/types";

const chats: Record<
	number,
	{ index: number; res?: ChatMessage; variant?: string }
> = {};

export const variants = ["creative", "balanced", "precise"];

const defaultTimeoutMs = 50 * 1000;
const defaultVariant = "Balanced";

export async function ai(
	ctx: Context<Update>,
	prompt: string,
): Promise<void | Message> {
	try {
		if (!prompt) {
			return await ctx.reply(
				"No prompt provided! Please read /help for more information.",
			);
		}

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

		let bingRes: ChatMessage;
		try {
			bingRes = await pTimeout(
				bingChat.sendMessage(
					prompt,
					Object.assign({}, chats[chatId].res, {
						variant: chats[chatId].variant ?? defaultVariant,
					}),
				),
				{
					milliseconds: defaultTimeoutMs,
					message: `No response from Bing, waited ${
						defaultTimeoutMs / 1000
					} seconds`,
				},
			);
		} catch (e) {
			return await ctx.reply((e as Error).message || "Something went wrong");
		}

		chats[chatId].res = bingRes;

		const tgRes = (() => {
			if (bingRes.text === prompt) {
				// Bing Chat often replies with the exact prompt
				// in case it's unable to continue the conversation.
				return "Bing replied with the exact text as your prompt. This usually happens when the AI is unable to continue the conversation. Starting a new chat with /newchat is recommended.";
			}

			if (!bingRes.text) {
				return "Received an empty response. Make sure the bot is set up properly and that you haven't crossed the daily message limit.";
			}

			return transformBingResponse(bingRes);
		})();

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
