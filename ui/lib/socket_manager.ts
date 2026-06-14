import { client } from "@/app/classes/client";
import { UI } from "@/app/classes/ui";
import { user } from "@/app/classes/user";
import Player from "@/app/entities/player";
import { getCraftableItems } from "./recipe";
import { world } from "@/app/classes/world";
import { entity_unit, plant_unit, player_unit } from "@/app/types";
export const PacketID = {
	handshake: 0,
	move: 1,
	attack: 2,
	leaderboard: 3,
	angle: 4,
	equip: 5,
	place: 6,
	update: 7,
	gauges: 8,
	chat: 9,
	stop_attack: 10,
	rain: 11,
	sandstorm: 12,
	blizzard: 13,
	dead: 14,
	delete: 15,
	craft: 16,
	team_create: 17,
	team_join: 18,
	team_leave: 19,
	team_list: 20,
	drop_one: 22,
	drop_all: 23,
	admin_command: 24,
	claim: 25,
	item_put: 26,
	item_take: 27,
	set_building: 28,
	tps: 29,
	refresh: 30,
	inv: 31,
	screen: 32,
	world: 33,
	msg: 34,
	build_done: 35,
	ping: 36,
	buildings_state: 37,
	build_open: 38,
	quests: 39,
};

type PacketIDType = (typeof PacketID)[keyof typeof PacketID];

const T = { INT32: 1, FLOAT: 2, BOOL: 3, STRING: 4, ARRAY: 5, ARRAY2D: 6 };

type ParsedValue = number | boolean | string | number[] | string[] | (string | number)[] | number[][];

interface Packet {
	packetId: PacketIDType;
	args: ParsedValue[];
}

export function readPacket(arrayBuffer: ArrayBuffer): Packet {
	const view = new DataView(arrayBuffer);
	let offset = 0;
	const packetId = view.getUint8(offset++) as PacketIDType;
	const args: ParsedValue[] = [];

	while (offset < view.byteLength) {
		const type = view.getUint8(offset++);
		switch (type) {
			case T.INT32:
				args.push(view.getInt32(offset, true));
				offset += 4;
				break;

			case T.FLOAT:
				args.push(view.getFloat32(offset, true));
				offset += 4;
				break;

			case T.BOOL:
				args.push(view.getUint8(offset++) === 1);
				break;

			case T.STRING: {
				const len = view.getUint16(offset, true);
				offset += 2;
				const bytes = new Uint8Array(arrayBuffer, offset, len);
				args.push(new TextDecoder().decode(bytes));
				offset += len;
				break;
			}

			case T.ARRAY: {
				const len = view.getUint16(offset, true);
				offset += 2;
				const arr: (number | string)[] = [];
				for (let i = 0; i < len; i++) {
					const tag = view.getUint8(offset++);
					switch (tag) {
						case T.INT32:
							arr.push(view.getInt32(offset, true));
							offset += 4;
							break;
						case T.FLOAT:
							arr.push(view.getFloat32(offset, true));
							offset += 4;
							break;
						case T.STRING: {
							const slen = view.getUint16(offset, true);
							offset += 2;
							const bytes = new Uint8Array(arrayBuffer, offset, slen);
							arr.push(new TextDecoder().decode(bytes));
							offset += slen;
							break;
						}
					}
				}
				args.push(arr);
				break;
			}

			case T.ARRAY2D: {
				const outerLen = view.getUint16(offset, true);
				offset += 2;
				const arr2d: number[][] = [];
				for (let i = 0; i < outerLen; i++) {
					offset++; // skip inner ARRAY type byte
					const innerLen = view.getUint16(offset, true);
					offset += 2;
					const inner: number[] = [];
					for (let j = 0; j < innerLen; j++) {
						inner.push(view.getInt32(offset, true));
						offset += 4;
					}
					arr2d.push(inner);
				}
				args.push(arr2d);
				break;
			}
		}
	}

	return { packetId, args };
}

// ─── Packet writer (client → server) ─────────────────────────────────────────

class PacketBuilder {
	private buf: number[] = [];

	constructor(id: PacketIDType) {
		this.buf.push(id);
	}

	writeBool(v: boolean): this {
		this.buf.push(T.BOOL, v ? 1 : 0);
		return this;
	}

	writeInt32(v: number): this {
		this.buf.push(T.INT32, v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff);
		return this;
	}

	writeFloat(v: number): this {
		this.buf.push(T.FLOAT);
		const tmp = new DataView(new ArrayBuffer(4));
		tmp.setFloat32(0, v, true);
		this.buf.push(...new Uint8Array(tmp.buffer));
		return this;
	}

	writeString(s: string): this {
		const encoded = new TextEncoder().encode(s);
		this.buf.push(T.STRING, encoded.length & 0xff, (encoded.length >> 8) & 0xff, ...encoded);
		return this;
	}

	build(): ArrayBuffer {
		return new Uint8Array(this.buf).buffer;
	}
}

export interface sockets {
	socket: WebSocket;
	received_msgs: string[];
	id: number;
	open: boolean;
	close: () => void;
	send: (msg: (number | string | boolean)[] | string | boolean | number) => void;
}

export class ws_manager {
	private uri: string;

	public ws: WebSocket | null;
	public sockets: sockets[] = [];

	public open: boolean = false;
	public current_socket: sockets | null = null;

	constructor(uri: string) {
		this.ws = null;
		this.uri = uri;
	}

	connect(update_ui?: () => void) {
		if (this.ws?.readyState === WebSocket.OPEN) return;
		this.ws = new WebSocket(this.uri);
		this.ws.binaryType = "arraybuffer";

		this.ws.onmessage = this.on_message.bind(this);
		this.ws.onopen = this.on_open.bind(this, update_ui);
		this.ws.onclose = this.on_close.bind(this, update_ui);
		this.ws.onerror = this.on_close.bind(this, update_ui);

		const closeSock = () => {
			this.ws?.close();
			this.current_socket!.open = false;
			update_ui?.();
		};

		this.current_socket = {
			socket: this.ws,
			received_msgs: [],
			id: Date.now(),
			open: false,
			close: closeSock,
			send: this.send.bind(this),
		};

		update_ui?.();
	}

	on_message({ data }: MessageEvent<ArrayBuffer>) {
		try {
			const { packetId, args } = readPacket(data);

			this.current_socket!.received_msgs.push([packetId, ...args].join(", "));

			switch (packetId) {
				case PacketID.handshake: {
					const [id, name, x, y, inv, hp, hunger, temprature, water, oxygen, angle, helmet, right] = args as [number, string, number, number, number[][], number, number, number, number, number, number, number, number];
					new Player(name || `player#${id}`, angle, 0, 0, 0, 0, x, y, helmet, right, id);
					user.alive = true;
					user.id = id;
					for (const [id, amount] of inv) amount > 0 && user.inv.items.set(id, amount);
					user.gauges.hp = hp / 100;
					user.gauges.hunger = hunger / 100;
					user.gauges.temprature = temprature / 100;
					user.gauges.water = water / 100;
					user.gauges.oxygen = oxygen / 100;

					user.craftables = getCraftableItems(user.inv.items);
					UI.changed = true;
					break;
				}
				case PacketID.gauges: {
					const [hp, hunger, temprature, water, oxygen] = args as [number, number, number, number, number];

					user.gauges.hp = hp / 200;
					user.gauges.hunger = hunger / 100;
					user.gauges.temprature = temprature / 100;
					user.gauges.water = water / 100;
					user.gauges.oxygen = oxygen / 100;
					break;
				}
				case PacketID.dead: {
					const [dead_id] = args as [number];
					client.kill(dead_id);
					break;
				}
				case PacketID.update: {
					const data = args as [number, ...entity_unit[]] | [number, ...player_unit[]] | [number, ...plant_unit[]];
					client.units(data);
					break;
				}
				case PacketID.tps: {
					user.tps = args[0] as number;
					break;
				}
				case PacketID.inv: {
					const inv = args[0] as number[][];
					for (const [id, amount] of inv) amount > 0 ? user.inv.items.set(id, amount) : user.inv.items.delete(id);

					user.craftables = getCraftableItems(user.inv.items);
					UI.changed = true;
					break;
				}
				case PacketID.world: {
					args.shift();
					client.world(args as [...[number, number, number, number, number, number][]]);
					break;
				}
				case PacketID.msg: {
					client.message(args[0] as string);
					break;
				}
				case PacketID.build_done: {
					user.select.id = -1;
					break;
				}
				case PacketID.ping: {
					user.ping.value = user.timestamp - user.ping.start;
					break;
				}
				case PacketID.buildings_state: {
					user.water = args[0] as boolean;
					user.fire = args[1] as boolean;
					user.bench = args[2] as boolean;
					user.chest = args[3] as boolean;
					user.oven = args[4] as boolean;
					user.windmill = args[5] as boolean;
					user.extractor = args[6] as boolean;
					user.resurection = args[7] as boolean;

					UI.changed = true;
					break;
				}
				case PacketID.build_open: {
					client.set_open_build(args as [number] | [number, number, number, number, number]);

					break;
				}
				case PacketID.quests: {
					console.log(args);
					client.quests(args);
					break;
				}
				case PacketID.chat: {
					break;
				}
			}
		} catch (e) {
			client.refresh_units();
		}
	}

	send(msg: (number | string | boolean)[] | string | boolean | number) {
		if (this.ws?.readyState == WebSocket.CLOSED) return;
		if (!Array.isArray(msg)) msg = [msg];

		const packet = new PacketBuilder(Number(msg[0]) as PacketIDType);

		for (const p of msg) {
			switch (typeof p) {
				case "number":
					if (Math.floor(p) === p) packet.writeInt32(p);
					else packet.writeFloat(p);
					break;
				case "string":
					packet.writeString(p);
					break;
				case "boolean":
					packet.writeBool(p);
					break;
			}
		}

		this.ws?.send(packet.build());
	}

	on_open(update_ui?: () => void) {
		this.current_socket!.open = true;
		user.alive = true;
		this.send([PacketID.handshake, user.name, user.token, user.token_id, user.cam.w, user.cam.h, 0, 0, 0, 0, 0, 0]);
		update_ui?.();
	}

	on_close(update_ui?: () => void) {
		this.current_socket!.open = false;
		this.current_socket!.close();
		update_ui?.();
		user.alive = false;
		client.reset();
	}
}
export const socket_manager = new ws_manager("ws://localhost:8080");
