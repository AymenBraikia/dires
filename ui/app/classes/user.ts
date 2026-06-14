import { CraftingRecipe } from "@/lib/recipe";
import Player from "../entities/player";
import { world } from "./world";
import { UI } from "./ui";

class User {
	active: boolean = false;
	quests_list: {
		id: number;
		i: string;
		details: string;
		requirements: string;
		time_left: number;
		last: number;
		can_claim: boolean;
		claimed: boolean;
	}[];
	extractor: boolean;
	windmill: boolean;
	oven: boolean;
	resurection: boolean;
	chest: boolean;
	bench: boolean;
	fire: boolean;
	water: boolean;
	msgs: Set<{ time: number; duration: number; content: string; is_active: boolean }>;
	me: Player | undefined;
	minimapCache: HTMLImageElement | undefined;
	tps: number;
	timestamp: number;
	put_amount: number;
	can_put: Set<number>;
	leaderboard: { name: string; score: number; id: number }[];
	select: {
		id: number;
		rotation: number;
		gridMode: boolean;
	};
	drop: {
		id: number;
		enabled: boolean;
	};
	inv: {
		max: number;
		items: Map<number, number>;
		swap: (i1: number, i2: number) => void;
	};
	previous_move: number;
	building: {
		input1: number;
		input2: number;
		output: number;
		output_id: number;
		lock: boolean;
		locked: boolean;
		lockpick: boolean;
		padlock: boolean;
		type: number;
		pid: number;
		iid: number;
		open: boolean;
	};
	ghost: {
		enabled: boolean;
		time: number;
		start: number;
	};
	alive: boolean;
	hasDied: boolean;
	reconnect: boolean;
	token: string;
	token_id: string;
	id: number;
	gauges: {
		o: {
			hp: number;
			hunger: number;
			temprature: number;
			water: number;
			oxygen: number;
			update: number;
			[key: string]: number;
		};
		hp: number;
		hunger: number;
		temprature: number;
		water: number;
		oxygen: number;
	};
	died: {
		reason: string;
		score: number;
		bank: number;
		kill: number;
	};
	team: [];
	cam: {
		x: number;
		y: number;
		update: () => void;
		w: number;
		h: number;
	};
	screenH?: number;
	screenW?: number;
	rain: number | boolean;
	sandstorm: number | boolean;
	blizzard: number | boolean;
	night: number | boolean;
	name: string;

	craftables: CraftingRecipe[];

	ping: {
		start: number;
		value: number;
	};

	constructor() {
		this.ping = {
			start: 0,
			value: 0,
		};

		this.quests_list = [
			{
				id: 0,
				i: "/items/satan_rune.png",
				details: "farm one reidite",
				requirements: "don't pick up drop boxes, don't take items from chests, don't use the market, don't open treasure chests, don't buy kits",
				time_left: 9 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			{
				id: 1,
				i: "/items/satan_shard.png",
				details: "defeat satan",
				requirements: "don't pick up drop boxes, don't take items from chests, don't use the market, don't open treasure chests, don't buy kits",
				time_left: 5 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			{
				id: 2,
				i: "/items/demonic_rune.png",
				details: "farm one amethyst",
				requirements: "don't pick up drop boxes, don't take items from chests, don't use the market, don't open treasure chests, don't buy kits",
				time_left: 2 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			{
				id: 3,
				i: "/items/demonic_shard.png",
				details: "defeat demons lord",
				requirements: "don't pick up drop boxes, don't take items from chests, don't use the market, don't open treasure chests, don't buy kits",
				time_left: 4 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			{
				id: 4,
				i: "/items/orange_gem.png",
				details: "open 5 treasure chests",
				requirements: "everything is allowed",
				time_left: 3 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			{
				id: 5,
				i: "/items/blue_gem.png",
				details: "don't harm peaceful creatures",
				requirements: "creatures to not attack: any babies, hawks, penguins, rabbits, players",
				time_left: 6 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			{
				id: 6,
				i: "/items/green_gem.png",
				details: "don't take any damage",
				requirements: "don't pick up drop boxes, don't take items from chests, don't use the market, don't open treasure chests, don't buy kits",
				time_left: 4 * 8 * 1e3 * 60,
				last: Date.now(),
				can_claim: false,
				claimed: false,
			},
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
			// {
			// 	i: "",
			// 	details: "get back your chess account",
			// 	requirements: "",
			// 	time_left: 5,
			// 	can_claim: false,
			// 	claimed: false,
			// },
		];

		this.bench = false;
		this.fire = false;
		this.water = false;
		this.extractor = false;
		this.windmill = false;
		this.oven = false;
		this.resurection = false;
		this.chest = false;

		this.craftables = [];

		this.rain = false;
		this.sandstorm = false;
		this.blizzard = false;

		this.msgs = new Set([]);

		this.name = "";

		this.tps = 0;
		this.timestamp = Date.now();
		this.put_amount = 10;
		this.can_put = new Set([]);
		this.leaderboard = [];
		this.drop = {
			id: -1,
			enabled: false,
		};
		this.select = {
			id: -1,
			rotation: 0,
			gridMode: false,
		};
		this.night = false;
		this.previous_move = 0;

		this.inv = {
			max: 16,
			items: new Map<number, number>(),
			swap(i1, i2) {
				if (i1 < 0 || i2 < 0) return;

				const arr = Array(...this.items);
				let ind1 = -1,
					ind2 = -1,
					s1: [number, number] = [-1, -1],
					s2: [number, number] = [-1, -1];

				for (const s of arr) {
					if (s[0] == i1) {
						ind1 = arr.indexOf(s);
						s1 = s;
					}
					if (s[0] == i2) {
						ind2 = arr.indexOf(s);
						s2 = s;
					}
				}

				if (!arr[ind1] || !arr[ind2]) return;

				arr[ind1] = s2;
				arr[ind2] = s1;
				user.inv.items = new Map(arr);
				UI.changed = true;
			},
		};

		this.building = {
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
		};

		this.ghost = {
			enabled: false,
			time: -1,
			start: -1,
		};

		this.alive = false;
		this.hasDied = false;
		this.reconnect = false;

		this.token = this.generate_token(16);
		this.token_id = this.generate_token(16);

		this.id = 0;
		this.gauges = {
			o: {
				hp: 100,
				hunger: 100,
				temprature: 100,
				water: 100,
				oxygen: 100,
				update: 0,
			},
			hp: 100,
			hunger: 100,
			temprature: 100,
			water: 100,
			oxygen: 100,
		};
		this.died = {
			reason: "",
			score: 0,
			bank: 0,
			kill: 0,
		};
		this.team = [];

		this.cam = {
			x: 0,
			y: 0,
			w: 0,
			h: 0,
			update: function () {
				var p = user.me;
				if (!p) return;

				this.x = innerWidth / 2 - p.x >= 0 ? 0 : innerWidth / 2 + p.x >= world.w ? -world.w + innerWidth : innerWidth / 2 - p.x;
				this.y = innerHeight / 2 - p.y >= 0 ? 0 : innerHeight / 2 + p.y >= world.h ? -world.h + innerHeight : innerHeight / 2 - p.y;
			},
		};
		typeof window != "undefined" ? (this.cam.w = window.innerWidth) : (this.cam.w = 0);
		typeof window != "undefined" ? (this.cam.h = window.innerHeight) : (this.cam.h = 0);
	}
	generate_token(len: number): string {
		const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*_";
		let token = "";

		for (let i = 0; i < len; i++) token += chars[Math.floor(Math.random() * chars.length)];

		return token;
	}
	check_msgs(): undefined | { content: string; is_active: boolean; time: number; duration: number } {
		for (const msg of this.msgs) {
			let m = undefined;
			if (((msg.time + 3e3 > this.timestamp && msg.content) || !msg.is_active) && !m) {
				if (!msg.is_active) {
					msg.time = this.timestamp;
					msg.is_active = true;
				}
				m = msg;
			} else if ((msg.time + 3e3 < this.timestamp || !msg.content) && msg.is_active) this.msgs.delete(msg);
			return m;
		}
	}

	update_quests_chrono() {
		for (const q in this.quests_list) {
			this.quests_list[q].time_left -= user.timestamp - this.quests_list[q].last;
			this.quests_list[q].last = user.timestamp;
			this.quests_list[q].time_left = Math.max(0, this.quests_list[q].time_left);
		}

		UI.update_ui((i) => i + 1);
	}
	init() {
		this.active = true;
		const t = window.localStorage.getItem("token");
		const t_id = window.localStorage.getItem("token");
		this.token = t ? t : this.generate_token(16);
		this.token_id = t_id ? t_id : this.generate_token(16);

		this.cam.w = screen.width;
		this.cam.h = screen.height;
		this.screenH = screen.height;
		this.screenW = screen.width;
	}
}

export const user = new User();
