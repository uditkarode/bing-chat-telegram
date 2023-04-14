import { done, firstPos, queue } from "./queue.js";
import { transformBingResponse } from "./transformers.js";
import { ChatMessage } from "bing-chat";
import { Context } from "telegraf";
import { FmtString, bold, fmt } from "telegraf/format";
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
	if (!prompt)
		return await ctx.reply(
			"No prompt provided! Please read /help for more information.",
		);

	// set up the chat object in `chats`
	const chatId = ctx.chat!.id;
	chats[chatId] ||= { index: 1 };

	const { pos, turn } = queue();

	let message_id: number;
	async function edit(msg: string | FmtString) {
		await ctx.telegram.editMessageText(chatId, message_id, undefined, msg, {
			disable_web_page_preview: true,
		});
	}

	try {
		// wait for our turn if we are not the first client in the queue
		if (pos > firstPos) {
			await ctx.reply(fmt`Queued at position: ${bold`${pos}`}`);
			await turn;
		}

		message_id = (
			await ctx.reply(
				fmt`${bold`[${chats[chatId].index++}]`} Running prompt...`,
			)
		).message_id;

		const bingRes = await pTimeout(
			bingChat.sendMessage(
				prompt,
				Object.assign({}, chats[chatId].res, {
					variant: chats[chatId].variant ?? defaultVariant,
				}),
			),
			{
				milliseconds: defaultTimeoutMs,
				fallback() {
					return new Error(
						`No response from Bing, waited ${defaultTimeoutMs / 1000} seconds`,
					);
				},
			},
		);

		// set the res to the chat object so the next message
		// can continue the same conversation
		if (!(bingRes instanceof Error)) {
			chats[chatId].res = bingRes;
		}

		await edit(getTgResponse(bingRes, prompt));
	} catch (e) {
		console.log("[local] caught error:");
		console.log(e);
		try {
			await edit(
				"Unable to obtain a response from Bing due to a technical error.",
			);
		} catch {}
	}

	// signal completion, let the next client proceed
	done();
}

function getTgResponse(bingRes: ChatMessage | Error, prompt: string) {
	if (bingRes instanceof Error) {
		return bingRes.message;
	}

	if (bingRes.text === prompt) {
		// Bing Chat often replies with the exact prompt
		// in case it's unable to continue the conversation.
		return "Bing replied with the exact text as your prompt. This usually happens when the AI is unable to continue the conversation. Starting a new chat with /newchat is recommended.";
	}

	if (!bingRes.text) {
		return "Received an empty response. Make sure the bot is set up properly and that you haven't crossed the daily message limit. You can also try starting a /newchat.";
	}

	return transformBingResponse(bingRes);
}

export function newChat(chatId: number) {
	const chat = chats[chatId];
	if (chat) {
		delete chat.res;
		chat.index = 1;
	}
}

export function getVariant(chatId: number) {
	return chats[chatId]?.variant ?? defaultVariant;
}

export function setVariant(chatId: number, variant: string) {
	chats[chatId] ||= { index: 1 };
	variant = variant.toLowerCase();
	chats[chatId].variant = variant.charAt(0).toUpperCase() + variant.slice(1);
}
