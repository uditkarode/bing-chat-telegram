// This code is licensed under the MIT License
// Copyright (c) MKRhere (https://mkr.pw)
import { FmtString } from "telegraf/format";
import { MessageEntity } from "typegram";

interface EntityCompare {
	offset: number;
	length: number;
}

/** get the starting of the entity */
const starts = (e: EntityCompare) => e.offset;

/** get the ending of the entity */
const ends = (e: EntityCompare) => e.offset + e.length;

const before = (A: EntityCompare, B: EntityCompare) =>
	// B ends before A starts
	ends(B) <= starts(A);

const after = (A: EntityCompare, B: EntityCompare) =>
	// B starts after A ends
	starts(B) >= ends(A);

const inside = (A: EntityCompare, B: EntityCompare) =>
	// B starts with/after A and ends before A
	(starts(B) >= starts(A) && ends(B) < ends(A)) ||
	// B starts after A and ends before/with A
	(starts(B) > starts(A) && ends(B) <= ends(A));

const contains = (A: EntityCompare, B: EntityCompare) =>
	// B starts before/with A and ends with/after A
	starts(B) <= starts(A) && ends(B) >= ends(A);

const endsInside = (A: EntityCompare, B: EntityCompare) =>
	// B starts before A starts, ends after A starts, ends before B ends
	starts(B) < starts(A) && ends(B) > starts(A) && ends(B) < ends(A);

const startsInside = (A: EntityCompare, B: EntityCompare) =>
	// B starts after A, starts before A ends, ends after A
	starts(B) > starts(A) && starts(B) < ends(A) && ends(B) > ends(A);

export const replace = (
	source: string | FmtString,
	search: string | RegExp,
	value: string | FmtString | ((...match: string[]) => string | FmtString),
): FmtString => {
	source = FmtString.normalise(source);

	let text = source.text;
	let entities: MessageEntity[] | undefined = source.entities;

	function fixEntities(offset: number, length: number, correction: number) {
		const A = { offset, length };

		return (entities || [])
			.map(E => {
				if (before(A, E)) return E;
				if (inside(A, E)) return;
				if (after(A, E)) return { ...E, offset: E.offset + correction };
				if (contains(A, E)) return { ...E, length: E.length + correction };
				if (endsInside(A, E))
					return { ...E, length: E.length - (ends(E) - starts(A)) };
				if (startsInside(A, E)) {
					const entityInside = ends(A) - starts(E);
					return {
						...E,
						offset: E.offset + entityInside + correction,
						length: E.length - entityInside,
					};
				}

				throw new Error(
					"Entity found in an unexpected condition. " +
						"This is probably a bug in telegraf. " +
						"You should report this to https://github.com/telegraf/telegraf/issues",
				);
			})
			.filter((x): x is MessageEntity => Boolean(x));
	}

	if (typeof search === "string") {
		const replace = FmtString.normalise(
			typeof value === "function" ? value(...search) : value,
		);
		const offset = text.indexOf(search);
		const length = search.length;
		text = text.slice(0, offset) + replace.text + text.slice(offset + length);
		const currentCorrection = replace.text.length - length;
		entities = [
			...fixEntities(offset, length, currentCorrection),
			...(replace.entities || []).map(E => ({
				...E,
				offset: E.offset + offset,
			})),
		];
	} else {
		let index = 0; // context position in text string
		let acc = ""; // incremental return value
		let correction = 0;

		let regexArray: RegExpExecArray | null;
		while ((regexArray = search.exec(text))) {
			const match = regexArray[0];
			const offset = regexArray.index;
			const length = match.length;
			const replace = FmtString.normalise(
				typeof value === "function" ? value(...regexArray) : value,
			);
			acc += text.slice(index, offset) + replace.text;
			const currentCorrection = replace.text.length - length;

			entities = [
				...fixEntities(offset + correction, length, currentCorrection),
				...(replace.entities || []).map(E => ({
					...E,
					offset: E.offset + offset + correction,
				})),
			];

			correction += currentCorrection;
			index = offset + length;
		}

		text = acc + text.slice(index);
	}

	return new FmtString(text, entities);
};
