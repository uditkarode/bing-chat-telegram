import EventEmitter from "events";

const emitter = new EventEmitter();

export const zerothPos = -1;
export const firstPos = zerothPos + 1;

let clients = zerothPos;

export function queue() {
	const pos = ++clients;

	return {
		pos,
		turn:
			pos == firstPos
				? // if this is the first client in the queue, no need to wait
				  Promise.resolve(pos)
				: // otherwise, wait for our turn
				  new Promise<number>(r => {
						const listener = (donePos: number) => {
							if (donePos == pos) {
								emitter.off("done", listener);
								r(pos);
							}
						};

						emitter.on("done", listener);
				  }),
	};
}

export function done() {
	if (clients == zerothPos) return;
	emitter.emit("done", clients--);
}
