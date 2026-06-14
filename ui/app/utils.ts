import { IDS, ITEMS, getSprite, MOB_SPRITES } from "./variables/vars";

// ── Preload mob/world entity sprites that aren't in the IDS inventory ──
const mobImgs: Record<keyof typeof MOB_SPRITES, HTMLImageElement> = {} as any;
if (typeof window !== "undefined") {
	for (const [key, src] of Object.entries(MOB_SPRITES) as [keyof typeof MOB_SPRITES, string][]) {
		const img = new Image();
		img.src = src;
		mobImgs[key] = img;
	}
}

const entitySpriteMap = new Map<number, () => HTMLImageElement | undefined>([
	[ITEMS.FIRE, () => getSprite(IDS.campfire)],
	[ITEMS.WORKBENCH, () => getSprite(IDS.workbench)],
	[ITEMS.SEED, () => getSprite(IDS.berrySeeds)],
	[ITEMS.WALL, () => getSprite(IDS.woodenWall)],
	[ITEMS.SPIKE, () => getSprite(IDS.woodenSpike)],
	[ITEMS.BIG_FIRE, () => getSprite(IDS.bigFire)],
	[ITEMS.STONE_WALL, () => getSprite(IDS.stoneWall)],
	[ITEMS.GOLD_WALL, () => getSprite(IDS.goldWall)],
	[ITEMS.DIAMOND_WALL, () => getSprite(IDS.diamondWall)],
	[ITEMS.WOOD_DOOR, () => getSprite(IDS.woodenDoor)],
	[ITEMS.CHEST, () => getSprite(IDS.chest)],
	[ITEMS.STONE_SPIKE, () => getSprite(IDS.stoneSpike)],
	[ITEMS.GOLD_SPIKE, () => getSprite(IDS.goldSpike)],
	[ITEMS.DIAMOND_SPIKE, () => getSprite(IDS.diamondSpike)],
	[ITEMS.STONE_DOOR, () => getSprite(IDS.stoneDoor)],
	[ITEMS.GOLD_DOOR, () => getSprite(IDS.goldDoor)],
	[ITEMS.DIAMOND_DOOR, () => getSprite(IDS.diamondDoor)],
	[ITEMS.FURNACE, () => getSprite(IDS.furnace)],
	[ITEMS.AMETHYST_WALL, () => getSprite(IDS.amethystWall)],
	[ITEMS.AMETHYST_SPIKE, () => getSprite(IDS.amethystSpike)],
	[ITEMS.AMETHYST_DOOR, () => getSprite(IDS.amethystDoor)],
	[ITEMS.RESURRECTION, () => getSprite(IDS.resurrectionStone)],
	[ITEMS.EMERALD_MACHINE, () => getSprite(IDS.emeraldMachine)],
	[ITEMS.BRIDGE, () => getSprite(IDS.bridge)],
	[ITEMS.WHEAT_SEED, () => getSprite(IDS.wheatSeeds)],
	[ITEMS.WINDMILL, () => getSprite(IDS.windmill)],
	[ITEMS.PLOT, () => getSprite(IDS.plantPlot)],
	[ITEMS.BREAD_OVEN, () => getSprite(IDS.breadOven)],
	[ITEMS.WELL, () => getSprite(IDS.well)],
	[ITEMS.PUMPKIN_SEED, () => getSprite(IDS.pumpkinSeeds)],
	[ITEMS.ROOF, () => getSprite(IDS.roof)],
	[ITEMS.GARLIC_SEED, () => getSprite(IDS.garlicSeeds)],
	[ITEMS.BED, () => getSprite(IDS.bed)],
	[ITEMS.TOMATO_SEED, () => getSprite(IDS.tomatoSeeds)],
	[ITEMS.CARROT_SEED, () => getSprite(IDS.carrotSeeds)],
	[ITEMS.REIDITE_WALL, () => getSprite(IDS.reiditeWall)],
	[ITEMS.REIDITE_DOOR, () => getSprite(IDS.reiditeDoor)],
	[ITEMS.REIDITE_SPIKE, () => getSprite(IDS.reiditeSpike)],
	[ITEMS.WATERMELON_SEED, () => getSprite(IDS.watermelonSeeds)],
	[ITEMS.ALOE_VERA_SEED, () => getSprite(IDS.aloeVeraSeeds)],
	[ITEMS.WOOD_TOWER, () => getSprite(IDS.tower)],
	[ITEMS.FRUIT, () => getSprite(IDS.berrySeeds)],
	// Mobs
	[ITEMS.BOX, () => mobImgs.box],
	[ITEMS.WOLF, () => mobImgs.wolf],
	[ITEMS.RABBIT, () => mobImgs.rabbit],
	[ITEMS.SPIDER, () => mobImgs.spider],
]);

const plantSpriteMap = new Map<number, () => HTMLImageElement>([
	[ITEMS.SEED, () => mobImgs.berry],
	[ITEMS.WHEAT_SEED, () => mobImgs.wheat],
	[ITEMS.PUMPKIN_SEED, () => mobImgs.pumpkin],
	[ITEMS.CARROT_SEED, () => mobImgs.carrot],
	[ITEMS.TOMATO_SEED, () => mobImgs.tomato],
	[ITEMS.GARLIC_SEED, () => mobImgs.garlic],
	[ITEMS.WATERMELON_SEED, () => mobImgs.watermelon],
	[ITEMS.ALOE_VERA_SEED, () => mobImgs.aloeVera],
]);

// ─────────────────────────────────────────────────────────────────────────
export const Utils = {
	compare_object(a: { [x: string]: any }, b: { [x: string]: any }) {
		for (var i in a) {
			if (a[i] != b[i]) return false;
		}
		return true;
	},

	compare_array(a: any[], b: any[]) {
		if (a.length != b.length) return false;
		for (var i = 0; i < a.length; i++) {
			if (typeof a == "object") {
				if (!this.compare_object(a[i], b[i])) return false;
			} else if (a[i] != b[i]) return false;
		}
		return true;
	},

	copy_vector(source: { x: number; y: number }, target: { x: number; y: number }) {
		target.x = source.x;
		target.y = source.y;
	},

	get_vector(v1: { x: number; y: number }, v2: { x: number; y: number }) {
		return { x: v1.x - v2.x, y: v1.y - v2.y };
	},

	mul_vector(v: { x: number; y: number }, mul: number) {
		v.x *= mul;
		v.y *= mul;
	},

	scalar_product(v1: { x: number; y: number }, v2: { x: number; y: number }) {
		return v1.x * v2.x + v1.y * v2.y;
	},

	norm(v: { x: number; y: number }) {
		return Math.sqrt(v.x * v.x + v.y * v.y);
	},

	sign(a: number) {
		return a < 0 ? -1 : 1;
	},

	cross_product(v1: { x: number; y: number }, v2: { x: number; y: number }) {
		return v1.x * v2.y - v1.y * v2.x;
	},

	get_angle_2(ax: number, ay: number, bx: number, by: number) {
		return Math.atan2(by - ay, bx - ax);
	},

	get_angle(v1: { x: number; y: number }, v2: { x: number; y: number }) {
		return Math.acos(this.scalar_product(v1, v2) / (this.norm(v1) * this.norm(v2))) * this.sign(this.cross_product(v1, v2));
	},

	reduceAngle(a1: number, a2: number) {
		const PI2 = Math.PI * 2;
		a2 = ((a2 % PI2) + PI2) % PI2;
		if (Math.abs(a1 - a2) > Math.PI) return a1 > a2 ? a2 + PI2 : a2 - PI2;
		return a2;
	},

	get_std_angle(o1: { x: number; y: number }, o2: { x: number; y: number }) {
		return this.get_angle({ x: 1, y: 0 }, this.get_vector(o1, o2));
	},

	dist(a: { x: number; y: number }, b: { x: number; y: number }) {
		return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
	},

	build_vector(d: number, a: number) {
		return { x: Math.cos(a) * d, y: Math.sin(a) * d };
	},

	add_vector(source: { x: number; y: number }, target: { x: number; y: number }) {
		source.x += target.x;
		source.y += target.y;
	},

	sub_vector(source: { x: number; y: number }, target: { x: number; y: number }) {
		source.x -= target.x;
		source.y -= target.y;
	},

	translate_vector(v: { x: number; y: number }, x: number, y: number) {
		v.x += x;
		v.y += y;
	},

	translate_new_vector(v: { x: number; y: number }, x: number, y: number) {
		return { x: v.x + x, y: v.y + y };
	},

	move(o: { x: number; y: number }, d: number, a: number) {
		o.x += Math.cos(a) * d;
		o.y += Math.sin(a) * d;
	},

	middle(a: number, b: number) {
		return Math.floor((a - b) / 2);
	},

	middle_point(a: { x: number; y: number }, b: { x: number; y: number }) {
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	},

	rand_sign() {
		return Math.random() > 0.5 ? 1 : -1;
	},

	get_rand_pos_in_circle(x: number, y: number, d: number) {
		const sx = this.rand_sign();
		const sy = this.rand_sign();
		const a = (Math.random() * Math.PI) / 2;
		return {
			x: Math.floor(x + Math.cos(a) * sx * d),
			y: Math.floor(y + Math.sin(a) * sy * d),
		};
	},

	simplify_number(n: number) {
		if (typeof n !== "number") return "0";
		if (n >= 10000) {
			const log = Math.floor(Math.log10(n)) - 2;
			const decimal = Math.max(0, 3 - log);
			let s = Math.floor(n / 1000).toString();
			if (decimal) {
				s += "." + ((n % 1000) / 1000).toString().substring(2).substring(0, decimal);
				let zero_counter = 0;
				for (let i = s.length - 1; i > 0; i--) {
					if (s[i] != "0") break;
					zero_counter++;
				}
				s = s.substring(0, s.length - zero_counter);
				if (s[s.length - 1] == ".") s = s.substring(0, s.length - 1);
			}
			return s + "k";
		}
		return n.toString();
	},

	inside_box(p: { x: number; y: number }, box: { h: number; w: number; x: number; y: number }) {
		return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
	},

	get_sprite(type: number): HTMLImageElement | undefined {
		return entitySpriteMap.get(type)?.();
	},

	get_sprite2(type: number): HTMLImageElement | undefined {
		return plantSpriteMap.get(type)?.();
	},
};
