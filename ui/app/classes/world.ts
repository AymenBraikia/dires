import { Entity } from "../entities/entity";
import { Plant } from "../entities/plant";
import Player from "../entities/player";
import { Resource } from "../entities/Resource";
import { player } from "../types";
import { ITEMS } from "../variables/vars";

class World {
	time: number;
	size: number;
	w: number;
	h: number;
	biomes: {
		type: "forest" | "winter" | "desert" | "lava" | "island" | "lake";
		x1: number;
		x2: number;
		y1: number;
		y2: number;
		r?: number;
		w?: number;
		h?: number;
	}[];
	// units: [...Map<number, Entity | Player>[]];
	units: Map<number, Entity | Player | Plant>[];
	fast_units: Map<number, Entity | Player | Plant>;
	resources: Map<number, Resource>;
	players: player[];
	constructor() {
		this.time = 0;
		this.size = 1e4;
		this.w = 10e3;
		this.h = 10e3;
		// this.mode = WORLD.MODE_PVP;
		this.players = [];
		this.units = [];
		this.resources = new Map<number, Resource>([]);
		this.fast_units = new Map<number, Entity | Player>([]);
		for (const [type, typeID] of Object.entries(ITEMS)) this.units[typeID] = new Map<number, Entity | Player>([]);
		// for (const type in ITEMS) this.units[ITEMS[type]] = [];
		this.biomes = [
			{
				type: "winter",
				x1: 0,
				x2: 4e3,
				y1: 0,
				y2: 4e3,
			},
			{
				type: "lava",
				x1: 6e3,
				x2: 10e3,
				y1: 0,
				y2: 4e3,
			},

			{
				type: "forest",
				x1: 0,
				x2: 4e3,
				y1: 6e3,
				y2: 10e3,
			},

			{
				type: "desert",
				x1: 6e3,
				x2: 10e3,
				y1: 6e3,
				y2: 10e3,
			},
		];
	}
}

export const world = new World();
