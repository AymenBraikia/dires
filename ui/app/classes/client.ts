import { PacketID, socket_manager } from "@/lib/socket_manager";
import { buildings, IDS, ITEMS } from "../variables/vars";
import { user } from "./user";
import { world } from "./world";
import Player from "../entities/player";
import { Entity } from "../entities/entity";
import { Resource } from "../entities/Resource";
import { Plant } from "../entities/plant";
import { entity_unit, plant_unit, player_unit } from "../types";
import { UI } from "./ui";
import { Crafting } from "./crafting";

class Client {
	constructor() {}

	send_angle(angle: number) {
		socket_manager.send([PacketID.angle, angle]);
	}
	send_attack() {
		socket_manager.send([PacketID.attack]);
	}
	stop_attack() {
		socket_manager.send([PacketID.stop_attack]);
	}
	send_move(move: number) {
		socket_manager.send([PacketID.move, move]);
	}
	send_build(id: number) {
		socket_manager.send([PacketID.place, id, user.select.gridMode]);
	}

	select_inv(id: number) {
		if (buildings.has(id)) {
			user.select.id = user.select.id == id ? -1 : id;
			user.select.rotation = 0;
			// user.select.gridMode = false;
			return;
		}
		user.select.id = -1;
		user.select.rotation = 0;
		user.select.gridMode = false;

		socket_manager.send([PacketID.equip, id]);
	}

	send_craft(itemId: number, duration?: number) {
		socket_manager.send([PacketID.craft, itemId]);
		if (duration) {
			user.me!.right == IDS.book && (duration *= 0.8);
			Crafting.craft.duration = duration;
			Crafting.craft.id = itemId;
			Crafting.craft.start = user.timestamp;
			Crafting.craft.end = user.timestamp + duration;
		}
	}

	drop_one(item_id: number) {
		socket_manager.send([PacketID.drop_one, item_id]);
	}

	drop_all(item_id: number) {
		socket_manager.send([PacketID.drop_all, item_id]);
	}
	put_item(id: number, amount: number = user.put_amount) {
		// [packet_id, entity_id, item_id , amount]
		const inv_amount = user.inv.items.get(id);
		if (!inv_amount) return;
		socket_manager.send([PacketID.item_put, user.building.iid, id, amount > inv_amount ? inv_amount : amount]);
	}
	take_item() {
		socket_manager.send([PacketID.item_take, user.building.iid]);
	}
	message(msg: string) {
		user.msgs.add({ content: msg, time: user.timestamp, duration: 3000, is_active: false });
	}
	kill(id: number) {
		let entity = world.fast_units.get(id);
		if (!entity) return;

		world.units[entity.type].delete(id);
		world.fast_units.delete(id);
	}
	units(units: [number, ...entity_unit[]] | [number, ...player_unit[]] | [number, ...plant_unit[]]) {
		for (let i = 1; i < units.length; i++) {
			let id: number, type: number, x: number, y: number, angle: number, name: string, right: number, helmet: number, attack: number, amount: number, hp, state, watered: 0 | 1, grown: 0 | 1;

			const data = units[i] as entity_unit | player_unit | plant_unit;

			[id, type] = data;

			if (!world.fast_units.get(id)) {
				switch (type) {
					case ITEMS.PLAYERS:
						[id, type, x, y, angle, name, right, helmet, attack] = data as player_unit;
						if (id == user.id) continue;
						new Player(name! || `player#${id}`, angle, 0, 0, 0, 0, x, y, helmet!, right!, id);

						break;
					case ITEMS.SEED:
					case ITEMS.WHEAT_SEED:
					case ITEMS.PUMPKIN_SEED:
					case ITEMS.CARROT_SEED:
					case ITEMS.TOMATO_SEED:
					case ITEMS.GARLIC_SEED:
					case ITEMS.WATERMELON_SEED:
					case ITEMS.ALOE_VERA_SEED:
						[id, type, amount, x, y, angle, grown, watered] = data as plant_unit;
						new Plant(type, x, y, angle, id, Boolean(grown), Boolean(watered), amount);
						break;

					default:
						[id, type, x, y, angle, hp, state] = data as entity_unit;
						new Entity(type, x, y, angle, id);
						break;
				}
				continue;
			} else {
				switch (type) {
					case ITEMS.PLAYERS:
						[id, type, x, y, angle, name, right, helmet, attack] = data as player_unit;

						const p = world.fast_units.get(id)! as Player;
						p.right = right || -1;
						p.helmet = helmet || -1;
						p.x = x;
						p.y = y;
						p.angle = angle;
						p.attack = Boolean(attack);
						break;

					case ITEMS.SEED:
					case ITEMS.WHEAT_SEED:
					case ITEMS.PUMPKIN_SEED:
					case ITEMS.CARROT_SEED:
					case ITEMS.TOMATO_SEED:
					case ITEMS.GARLIC_SEED:
					case ITEMS.WATERMELON_SEED:
					case ITEMS.ALOE_VERA_SEED:
						[id, , amount, , , , grown, watered] = data as plant_unit;
						const plant = world.fast_units.get(id)! as Plant;
						plant.amount = amount;
						plant.grown = Boolean(grown);
						plant.watered = Boolean(watered);

						break;

					default:
						[id, type, x, y, angle, hp, state] = data as entity_unit;
						const e = world.fast_units.get(id)! as Entity;
						e.x = x;
						e.y = y;
						e.angle = angle;
						e.hp = hp;
						e.state = state;
						break;
				}
			}
		}
	}
	set_open_build(data: [number] | [number, number, number, number, number]) {
		UI.changed = true;
		const [id, i1, i2, a, t] = data;
		const b = world.fast_units.get(id);
		if (!b) {
			UI.chest_btn_img = undefined;
			return (user.building = {
				input1: 0,
				input2: 0,
				output: 0,
				output_id: -1,
				type: 0,
				pid: 0,
				iid: 0,
				open: false,
				lock: false,
				locked: false,
				lockpick: false,
				padlock: false,
			});
		}

		user.building.iid = b.id;
		user.building.type = b.type;
		user.building.open = true;
		user.building.input1 = i1 || 0;
		user.building.input2 = i2 || 0;
		user.building.output = a || 0;
		user.building.output_id = t || 0;

		if (b.type == ITEMS.CHEST && a! <= 0) UI.chest_btn_img = undefined;
	}
	quests(data:unknown){
		
	}

	ping() {
		user.ping.start = user.timestamp;
		socket_manager.send(PacketID.ping);
	}
	world(data: [...[number, number, number, number, number, number][]]) {
		for (const [id, type, x, y, size, angle] of data) new Resource(type, x, y, angle, id, size);
		user.minimapCache = undefined;
	}
	refresh_units() {
		socket_manager.send(PacketID.refresh);
	}
	reset() {
		world.fast_units = new Map<number, Entity | Player>([]);
		world.resources = new Map<number, Resource>([]);
		user.craftables = [];
		user.building.open = false;
		for (const [type, typeID] of Object.entries(ITEMS)) world.units[typeID] = new Map<number, Entity | Player>([]);
		user.inv.items = new Map<number, number>([]);
	}
}

export const client = new Client();
