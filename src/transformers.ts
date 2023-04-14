import { replace } from "./fmt-replace.js";
import { ChatMessage } from "bing-chat";
import { FmtString, bold, code, fmt, italic, link, pre } from "telegraf/format";

type Transformers = ((reply: FmtString, res: ChatMessage) => FmtString)[];

export function transformBingResponse(res: ChatMessage) {
	return transformers.reduce(
		(text, transformer) => transformer(text, res),
		new FmtString(res.text),
	);
}

export const transformers: Transformers = [
	function addNewChatSuffix(reply) {
		const lowercaseReply = reply.text.toLowerCase();
		const triggers = [
			"“new topic",
			"prefer not to continue",
			"still learning so I appreciate your understanding and patience",
			"I cannot continue this conversation",
		];

		if (triggers.some(trigger => lowercaseReply.includes(trigger)))
			return fmt`${reply}\n\nUse /newchat to start a new topic.`;

		return reply;
	},

	function styleBold(reply) {
		return replace(reply, /\*\*(.*?)\*\*/g, (_, txt) => bold(txt));
	},

	function styleItalic(reply) {
		return replace(reply, /_(.*?)_/g, (_, txt) => italic(txt));
	},

	function styleAlternateItalic(reply) {
		return replace(reply, /\*(.*?)\*/g, (_, txt) => italic(txt));
	},

	function stylePre(reply) {
		return replace(
			reply,
			/```(\w+)\n([\s\S]*?)```/g,
			(_, language, codeString) => {
				return pre(language)(codeString);
			},
		);
	},

	function styleCode(reply) {
		return replace(reply, /`(.*?)`/g, (_, codeString) => code(codeString));
	},

	function styleReferences(reply, res) {
		const references = res.detail?.sourceAttributions;
		if (!references) return reply;

		return replace(reply, /\[\^(.)\^\]/g, (_, oneBasedIndex) => {
			const referenceLink = references[parseInt(oneBasedIndex) - 1]?.seeMoreUrl;
			if (!referenceLink) return "";
			return fmt` ${bold(link(`[${oneBasedIndex}]`, referenceLink))}`;
		});
	},
];
