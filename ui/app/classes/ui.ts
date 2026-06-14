import { IDS, ITEMS, getSprite } from "../variables/vars";
import { user } from "./user";
import { Crafting } from "./crafting";
import { client } from "./client";
import { getCraftableItems } from "@/lib/recipe";
import mouse from "./mouse";
import { Dispatch, SetStateAction } from "react";

// Rotated item IDs — tools/weapons drawn at an angle
const ROTATED_ITEMS = new Set([
	IDS.stoneSword,
	IDS.goldSword,
	IDS.diamondSword,
	IDS.amethystSword,
	IDS.reiditeSword,
	IDS.demonicSword,
	IDS.satanSword,
	IDS.pirateSword,

	IDS.stoneSpear,
	IDS.goldSpear,
	IDS.diamondSpear,
	IDS.amethystSpear,
	IDS.reiditeSpear,
	IDS.demonicSpear,
	IDS.satanSpear,

	IDS.stoneAxe,
	IDS.goldAxe,
	IDS.diamondAxe,
	IDS.amethystAxe,
	IDS.reiditeAxe,
	IDS.demonicAxe,
	IDS.satanAxe,

	IDS.stoneHammer,
	IDS.goldHammer,
	IDS.diamondHammer,
	IDS.amethystHammer,
	IDS.reiditeHammer,

	IDS.woodenPickaxe,
	IDS.stonePickaxe,
	IDS.goldPickaxe,
	IDS.diamondPickaxe,
	IDS.amethystPickaxe,
	IDS.reiditePickaxe,

	IDS.stoneShovel,
	IDS.goldShovel,
	IDS.diamondShovel,
	IDS.amethystShovel,
	IDS.reiditeShovel,

	IDS.machete,
	IDS.pitchfork,
	IDS.goldPitchfork,
	IDS.wrench,
	IDS.wateringCan,
	IDS.filledWateringCan,
]);

// Cache for rendered inventory icons (canvas → image, with rotation applied)
const invIconCache = new Map<number, HTMLImageElement>();

class _UI {
	update_ui: Dispatch<SetStateAction<number>> = () => {};
	skip_drop_prompt: boolean;
	refresh_ui: boolean = false;

	furnace_btn_img: HTMLImageElement;
	oven_btn_imgs: [HTMLImageElement, HTMLImageElement, HTMLImageElement];
	windmill_btn_imgs: [HTMLImageElement, HTMLImageElement];
	extractor_btn_imgs: [HTMLImageElement, HTMLImageElement, HTMLImageElement, HTMLImageElement, HTMLImageElement, HTMLImageElement];
	chest_btn_img: HTMLImageElement | undefined;

	ctx: CanvasRenderingContext2D | undefined;
	changed: boolean;

	buttons_ids: number;
	buttons: Map<number, { x1: number; y1: number; x2: number; y2: number; item?: number; action: (e?: MouseEvent) => any; action2: (e?: MouseEvent) => any; type?: "inv" | "craft" | "UI" | "build" | null }>;

	translate: { x: number; y: number };

	slots: { x1: number; y1: number; x2: number; y2: number; i: number }[];
	slots_events: { x1: number; y1: number; x2: number; y2: number; i: number; ev: (e: MouseEvent) => any }[];

	fps: number;
	frames: number;
	last_fps_reset: number;

	icons: any[];
	icons_src: string[];

	html: {
		recipe: HTMLDivElement | null;
		quest: HTMLDivElement | null;
		teams: HTMLDivElement | null;
		settings: HTMLDivElement | null;
		market: HTMLDivElement | null;
	};

	clrs: {
		primary: string;
		secondary: string;
		tertiary: string;
	};

	constructor() {
		this.clrs = {
			primary: "#2f220c",
			secondary: "rgb(109 77 16)",
			tertiary: "#8b6b2f",
		};

		this.skip_drop_prompt = false;
		this.furnace_btn_img = getSprite(IDS.wood)!;
		this.oven_btn_imgs = [getSprite(IDS.wood)!, getSprite(IDS.flour)!, getSprite(IDS.bread)!];
		this.windmill_btn_imgs = [getSprite(IDS.wheat)!, getSprite(IDS.flour)!];
		this.extractor_btn_imgs = [getSprite(IDS.wood)!, getSprite(IDS.stone)!, getSprite(IDS.gold)!, getSprite(IDS.diamond)!, getSprite(IDS.amethyst)!, getSprite(IDS.reidite)!];

		this.translate = { x: 0, y: 0 };
		this.buttons = new Map([]);
		this.buttons_ids = 0;
		this.changed = true;

		this.slots = [];
		this.slots_events = [];

		this.fps = 0;
		this.frames = 0;
		this.last_fps_reset = 0;
		this.icons = [];
		this.icons_src = ["/icons/recipe.png", "/icons/chrono.png", "/icons/settings.png", "/icons/teams.png"];
		this.html = { recipe: null, quest: null, teams: null, settings: null, market: null };
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!user.alive) return;
		if (this.changed) {
			user.craftables = getCraftableItems(user.inv.items);
			this.set_buttons.bind(this)();
			this.changed = false;
		}

		this.draw_inventory(ctx);
		Crafting.draw(ctx);
		this.draw_fps(ctx);
		this.drawLdb(ctx);
		this.drawBtns(ctx);
		// this.drawGhostCountdown(ctx);
		if (user.building.open)
			switch (user.building.type) {
				case ITEMS.BREAD_OVEN:
					this.draw_bread_buttons(ctx);
					break;
				case ITEMS.WINDMILL:
					this.draw_windmill_buttons(ctx);
					break;
				case ITEMS.FURNACE:
					this.draw_furnace_buttons(ctx);
					break;
				case ITEMS.CHEST:
					this.draw_chest_buttons(ctx);
					break;

				case ITEMS.EXTRACTOR_MACHINE_STONE:
					this.draw_extractor_buttons(ctx, 1);
					break;
				case ITEMS.EXTRACTOR_MACHINE_GOLD:
					this.draw_extractor_buttons(ctx, 2);
					break;
				case ITEMS.EXTRACTOR_MACHINE_DIAMOND:
					this.draw_extractor_buttons(ctx, 3);
					break;
				case ITEMS.EXTRACTOR_MACHINE_AMETHYST:
					this.draw_extractor_buttons(ctx, 4);
					break;
				case ITEMS.EXTRACTOR_MACHINE_REIDITE:
					this.draw_extractor_buttons(ctx, 5);
					break;
			}
	}

	drawLdb(ctx: CanvasRenderingContext2D) {
		const padding = 20;
		const offsetX = ctx.canvas.width - padding;
		const offsetY = padding;
		const w = 250;
		const h = 300;

		ctx.fillStyle = "#14373482";
		ctx.beginPath();
		ctx.roundRect(offsetX - w, offsetY, w, h, 15);
		ctx.fill();

		ctx.fillStyle = "white";
		ctx.font = "700 24px lexend";
		const text = ctx.measureText("LeaderBoard");
		ctx.fillText("LeaderBoard", offsetX - w / 2 - text.width / 2, offsetY + padding + 12);

		const players = user.leaderboard;
		let y = 0;
		const x = offsetX - w + 20;

		for (let i = 0; i < players.length; i++) {
			const p = players[i];
			ctx.fillStyle = user.id == p.id ? "#fff" : "#ddd";
			ctx.font = "700 18px lexend";
			ctx.fillText(String(i + 1), x, offsetY + padding + y + 40);
			const scoreTxt = ctx.measureText(this.simplify(p.score));
			ctx.fillText(p.name, x + 30, offsetY + padding + y + 40, w - 80 - scoreTxt.width);
			ctx.fillText(this.simplify(p.score), offsetX - 20 - scoreTxt.width, offsetY + padding + y + 40);
			y += 24;
		}
	}

	simplify(num: number): string {
		if (typeof num != "number") return "";
		const str = String(num);
		if (str.length > 12) return `${num / 1e12}t`;
		if (str.length > 9) return `${num / 1e9}b`;
		if (str.length > 6) return `${num / 1e6}m`;
		if (str.length > 3) return `${num / 1e3}k`;
		return str;
	}

	drawBtns(ctx: CanvasRenderingContext2D) {
		const padding = 20;
		const w = 50;
		const h = 50;
		const x = ctx.canvas.width - 270 - w;
		const y = padding + 20;
		if (this.icons.length == 0)
			for (const src of this.icons_src) {
				const img = new Image();
				img.src = src;
				this.icons.push(img);
			}

		for (let i = 0; i < this.icons.length; i++) {
			const img = this.icons[i];
			ctx.drawImage(img, x - w / 2, y + i * (h + 10) - h / 2, w, h);
		}
	}

	draw_inventory(ctx: CanvasRenderingContext2D) {
		const can = ctx.canvas;

		const arr = Array(...user.inv.items);

		const slots = user.inv.max;
		const width = 75;
		const height = 75;
		const gap = 15;
		const radius = 10;
		const totalWidth = width * slots + gap * (slots - 1);
		let slot_x = 0;

		ctx.lineWidth = 4;
		ctx.save();

		const panelX = (can.width - totalWidth) / 2 - 15;
		const panelY = can.height - 65 - height;
		const panelWidth = totalWidth + 30;
		const panelHeight = height + 30;

		ctx.globalAlpha = 0.6;
		ctx.beginPath();
		ctx.moveTo(panelX + 15, panelY);
		ctx.lineTo(panelX + panelWidth - 15, panelY);
		ctx.arcTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + 15, 15);
		ctx.lineTo(panelX + panelWidth, panelY + panelHeight - 15);
		ctx.arcTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - 15, panelY + panelHeight, 15);
		ctx.lineTo(panelX + 15, panelY + panelHeight);
		ctx.arcTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - 15, 15);
		ctx.lineTo(panelX, panelY + 15);
		ctx.arcTo(panelX, panelY, panelX + 15, panelY, 15);
		ctx.closePath();

		ctx.strokeStyle = "#050608e6";
		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.stroke();
		ctx.fill();

		ctx.globalAlpha = 1;

		for (let i = 0; i < slots; i++) {
			const x = (can.width - totalWidth) / 2 + slot_x - this.translate.x;
			const y = can.height - 50 - height - this.translate.y;
			const active = user.inv.items.size > i;

			ctx.fillStyle = "#080c0f";
			ctx.strokeStyle = "#182b3a";
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + width - radius, y);
			ctx.arcTo(x + width, y, x + width, y + radius, radius);
			ctx.lineTo(x + width, y + height - radius);
			ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
			ctx.lineTo(x + radius, y + height);
			ctx.arcTo(x, y + height, x, y + height - radius, radius);
			ctx.lineTo(x, y + radius);
			ctx.arcTo(x, y, x + radius, y, radius);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 3;
			ctx.strokeStyle = active ? "rgba(0, 255, 152, 0.6)" : "rgba(100, 120, 140, 0.4)";
			ctx.stroke();

			slot_x += width + gap;

			if (active) {
				const id: number = arr[i][0];
				const amount: number = arr[i][1] || 0;

				if (amount <= 0) {
					user.inv.items.delete(id);
					// user.inv.items = user.inv.items.filter((e) => e !== id);
					continue;
				}

				if (user.can_put.has(id) || user.can_put.has(-1)) {
					ctx.strokeStyle = "gold";
					ctx.stroke();
				}

				// if (user.inv.amounts.size > user.inv.items.length) for (const value of user.inv.amounts.keys()) if (!user.inv.items.includes(value)) user.inv.items.push(value);

				const img = this.create_item_button(id);
				ctx.drawImage(img, x + 5, y + 5, width - 10, height - 10);

				ctx.fillStyle = "#ffffff";
				ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
				ctx.lineWidth = 3;
				ctx.font = "700 20px lexend";

				const text = `x${amount}`;
				const textWidth = ctx.measureText(text).width;
				ctx.strokeText(text, x + width - textWidth - 8, y + height - 8);
				ctx.fillText(text, x + width - textWidth - 8, y + height - 8);
				ctx.strokeText(String(i + 1), x + 8, y + 20);
				ctx.fillText(String(i + 1), x + 8, y + 20);
			}
		}
		ctx.restore();
	}

	/** Returns a cached, rotation-applied canvas image for inventory display. */
	create_item_button(id: number): HTMLImageElement | HTMLCanvasElement {
		if (invIconCache.has(id)) return invIconCache.get(id)!;

		const source = getSprite(id);
		const canvas = document.createElement("canvas");
		canvas.width = 65;
		canvas.height = 65;
		const ctx = canvas.getContext("2d")!;

		if (!source?.width || !source?.height) return canvas;

		const scale = Math.min((canvas.width * 0.8) / source.width, (canvas.height * 0.8) / source.height);
		const sw = source.width * scale;
		const sh = source.height * scale;

		ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
		ctx.shadowBlur = 4;
		ctx.shadowOffsetY = 2;

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		if (ROTATED_ITEMS.has(id)) ctx.rotate(Math.PI * 1.15);
		ctx.drawImage(source, -sw / 2, -sh / 2, sw, sh);
		ctx.restore();

		const img = new Image();
		img.src = canvas.toDataURL();
		invIconCache.set(id, img);
		return img;
	}

	draw_fps(ctx: CanvasRenderingContext2D) {
		this.frames++;
		const delta = user.timestamp - this.last_fps_reset;

		if (delta >= 1000) {
			this.fps = this.frames;
			this.frames = 0;
			this.last_fps_reset = user.timestamp;

			client.ping();
			user.update_quests_chrono();
		}

		ctx.lineWidth = 3;
		ctx.fillStyle = "#fff";
		ctx.strokeStyle = "black";
		ctx.font = "700 30px lexend";

		ctx.strokeText(user.tps + "TPS", ctx.canvas.width - 480, 60);
		ctx.fillText(user.tps + "TPS", ctx.canvas.width - 480, 60);

		ctx.strokeText(this.fps + "FPS", ctx.canvas.width - 480, 90);
		ctx.fillText(this.fps + "FPS", ctx.canvas.width - 480, 90);

		ctx.strokeText(user.ping.value + "ms", ctx.canvas.width - 480, 120);
		ctx.fillText(user.ping.value + "ms", ctx.canvas.width - 480, 120);
	}

	draw_bread_buttons(ctx: CanvasRenderingContext2D) {
		const p = 20;
		const g = 15;
		const r = 15;

		let x = 20;
		let y = 450;

		const w = 75;
		const h = 75;

		const panelWidth = 3 * (w + g) + p;
		const panelHeight = h + g + p;

		ctx.save();
		ctx.globalAlpha = 0.9;

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + panelWidth - r, y);
		ctx.arcTo(x + panelWidth, y, x + panelWidth, y + r, r);
		ctx.lineTo(x + panelWidth, y + panelHeight - r);
		ctx.arcTo(x + panelWidth, y + panelHeight, x + panelWidth - r, y + panelHeight, r);
		ctx.lineTo(x + r, y + panelHeight);
		ctx.arcTo(x, y + panelHeight, x, y + panelHeight - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();

		ctx.strokeStyle = "#050608e6";
		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.stroke();
		ctx.fill();

		ctx.globalAlpha = 1;

		x += p;
		y += p;

		const imgs = [this.oven_btn_imgs[0], this.oven_btn_imgs[1], this.oven_btn_imgs[2]];
		const txts = [user.building.input1, user.building.input2, user.building.output];

		for (let i = 0; i < 3; i++) {
			const img = imgs[i];

			ctx.fillStyle = "#080c0f";
			ctx.strokeStyle = "#182b3a";

			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.arcTo(x + w, y, x + w, y + r, r);
			ctx.lineTo(x + w, y + h - r);
			ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
			ctx.lineTo(x + r, y + h);
			ctx.arcTo(x, y + h, x, y + h - r, r);
			ctx.lineTo(x, y + r);
			ctx.arcTo(x, y, x + r, y, r);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 3;
			ctx.strokeStyle = "rgba(100, 120, 140, 0.4)";
			ctx.stroke();

			ctx.globalAlpha = txts[i] > 0 ? 1 : 0.3;
			if (img) ctx.drawImage(img, x, y, w, h);
			ctx.globalAlpha = 1;

			const txt = "x" + txts[i];

			ctx.fillStyle = "white";
			ctx.strokeStyle = "black";

			ctx.font = "700 22px lexend";
			const offsetX = x + w - 32 - ctx.measureText(txt).width / 2;
			const offsetY = y + h - 16;

			ctx.strokeText(txt, offsetX, offsetY);
			ctx.fillText(txt, offsetX, offsetY);
			x += w + g;
		}

		ctx.restore();
	}
	draw_extractor_buttons(ctx: CanvasRenderingContext2D, t: number) {
		const p = 20;
		const g = 15;
		const r = 15;

		let x = 20;
		let y = 450;

		const w = 75;
		const h = 75;

		const panelWidth = 2 * (w + g) + p;
		const panelHeight = h + g + p;

		ctx.save();
		ctx.globalAlpha = 0.9;

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + panelWidth - r, y);
		ctx.arcTo(x + panelWidth, y, x + panelWidth, y + r, r);
		ctx.lineTo(x + panelWidth, y + panelHeight - r);
		ctx.arcTo(x + panelWidth, y + panelHeight, x + panelWidth - r, y + panelHeight, r);
		ctx.lineTo(x + r, y + panelHeight);
		ctx.arcTo(x, y + panelHeight, x, y + panelHeight - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();

		ctx.strokeStyle = "#050608e6";
		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.stroke();
		ctx.fill();

		ctx.globalAlpha = 1;

		x += p;
		y += p;

		const imgs = [this.extractor_btn_imgs[0], this.extractor_btn_imgs[t]];
		const txts = [user.building.input1, user.building.output];

		for (let i = 0; i < 2; i++) {
			const img = imgs[i];

			ctx.fillStyle = "#080c0f";
			ctx.strokeStyle = "#182b3a";

			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.arcTo(x + w, y, x + w, y + r, r);
			ctx.lineTo(x + w, y + h - r);
			ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
			ctx.lineTo(x + r, y + h);
			ctx.arcTo(x, y + h, x, y + h - r, r);
			ctx.lineTo(x, y + r);
			ctx.arcTo(x, y, x + r, y, r);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 3;
			ctx.strokeStyle = "rgba(100, 120, 140, 0.4)";
			ctx.stroke();

			ctx.globalAlpha = txts[i] > 0 ? 1 : 0.3;
			if (img) ctx.drawImage(img, x, y, w, h);
			ctx.globalAlpha = 1;

			const txt = "x" + txts[i];

			ctx.fillStyle = "white";
			ctx.strokeStyle = "black";

			ctx.font = "700 22px lexend";
			const offsetX = x + w - 32 - ctx.measureText(txt).width / 2;
			const offsetY = y + h - 16;

			ctx.strokeText(txt, offsetX, offsetY);
			ctx.fillText(txt, offsetX, offsetY);

			x += w + g;
		}

		ctx.restore();
	}
	draw_windmill_buttons(ctx: CanvasRenderingContext2D) {
		const p = 20;
		const g = 15;
		const r = 15;

		let x = 20;
		let y = 450;

		const w = 75;
		const h = 75;

		const panelWidth = 2 * (w + g) + p;
		const panelHeight = h + g + p;

		ctx.save();
		ctx.globalAlpha = 0.9;

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + panelWidth - r, y);
		ctx.arcTo(x + panelWidth, y, x + panelWidth, y + r, r);
		ctx.lineTo(x + panelWidth, y + panelHeight - r);
		ctx.arcTo(x + panelWidth, y + panelHeight, x + panelWidth - r, y + panelHeight, r);
		ctx.lineTo(x + r, y + panelHeight);
		ctx.arcTo(x, y + panelHeight, x, y + panelHeight - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();

		ctx.strokeStyle = "#050608e6";
		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.stroke();
		ctx.fill();

		ctx.globalAlpha = 1;

		x += p;
		y += p;

		const imgs = [this.windmill_btn_imgs[0], this.windmill_btn_imgs[1]];
		const txts = [user.building.input1, user.building.output];

		for (let i = 0; i < 2; i++) {
			const img = imgs[i];

			ctx.fillStyle = "#080c0f";
			ctx.strokeStyle = "#182b3a";

			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.arcTo(x + w, y, x + w, y + r, r);
			ctx.lineTo(x + w, y + h - r);
			ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
			ctx.lineTo(x + r, y + h);
			ctx.arcTo(x, y + h, x, y + h - r, r);
			ctx.lineTo(x, y + r);
			ctx.arcTo(x, y, x + r, y, r);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 3;
			ctx.strokeStyle = "rgba(100, 120, 140, 0.4)";
			ctx.stroke();

			ctx.globalAlpha = txts[i] > 0 ? 1 : 0.3;
			if (img) ctx.drawImage(img, x, y, w, h);
			ctx.globalAlpha = 1;

			const txt = "x" + txts[i];

			ctx.fillStyle = "white";
			ctx.strokeStyle = "black";

			ctx.font = "700 22px lexend";
			const offsetX = x + w - 32 - ctx.measureText(txt).width / 2;
			const offsetY = y + h - 16;

			ctx.strokeText(txt, offsetX, offsetY);
			ctx.fillText(txt, offsetX, offsetY);

			x += w + g;
		}

		ctx.restore();
	}

	draw_chest_buttons(ctx: CanvasRenderingContext2D) {
		const p = 20;
		const g = 15;
		const r = 15;

		let x = 20;
		let y = 450;

		const w = 75;
		const h = 75;

		const panelWidth = w + g + p;
		const panelHeight = h + g + p;

		ctx.save();
		ctx.globalAlpha = 0.9;

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + panelWidth - r, y);
		ctx.arcTo(x + panelWidth, y, x + panelWidth, y + r, r);
		ctx.lineTo(x + panelWidth, y + panelHeight - r);
		ctx.arcTo(x + panelWidth, y + panelHeight, x + panelWidth - r, y + panelHeight, r);
		ctx.lineTo(x + r, y + panelHeight);
		ctx.arcTo(x, y + panelHeight, x, y + panelHeight - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();

		ctx.strokeStyle = "#050608e6";
		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.stroke();
		ctx.fill();

		ctx.globalAlpha = 1;

		x += p;
		y += p;

		const img = this.chest_btn_img;

		ctx.fillStyle = "#080c0f";
		ctx.strokeStyle = "#182b3a";

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.arcTo(x + w, y, x + w, y + r, r);
		ctx.lineTo(x + w, y + h - r);
		ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
		ctx.lineTo(x + r, y + h);
		ctx.arcTo(x, y + h, x, y + h - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();

		ctx.lineWidth = 3;
		ctx.strokeStyle = "rgba(100, 120, 140, 0.4)";
		ctx.stroke();

		if (user.building.output <= 0) return;

		if (img) ctx.drawImage(img, x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8);
		else this.chest_btn_img = getSprite(user.building.output_id);

		const txt = "x" + user.building.output;

		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";

		ctx.font = "700 22px lexend";
		const offsetX = x + w - 32 - ctx.measureText(txt).width / 2;
		const offsetY = y + h - 16;

		ctx.strokeText(txt, offsetX, offsetY);
		ctx.fillText(txt, offsetX, offsetY);
		ctx.restore();
	}

	draw_furnace_buttons(ctx: CanvasRenderingContext2D) {
		const p = 20;
		const g = 15;
		const r = 15;

		let x = 20;
		let y = 450;

		const w = 75;
		const h = 75;

		const panelWidth = w + g + p;
		const panelHeight = h + g + p;

		ctx.save();
		ctx.globalAlpha = 0.9;

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + panelWidth - r, y);
		ctx.arcTo(x + panelWidth, y, x + panelWidth, y + r, r);
		ctx.lineTo(x + panelWidth, y + panelHeight - r);
		ctx.arcTo(x + panelWidth, y + panelHeight, x + panelWidth - r, y + panelHeight, r);
		ctx.lineTo(x + r, y + panelHeight);
		ctx.arcTo(x, y + panelHeight, x, y + panelHeight - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();

		ctx.strokeStyle = "#050608e6";
		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.stroke();
		ctx.fill();

		ctx.globalAlpha = 1;

		x += p;
		y += p;

		const img = this.furnace_btn_img;

		ctx.fillStyle = "#080c0f";
		ctx.strokeStyle = "#182b3a";

		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.arcTo(x + w, y, x + w, y + r, r);
		ctx.lineTo(x + w, y + h - r);
		ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
		ctx.lineTo(x + r, y + h);
		ctx.arcTo(x, y + h, x, y + h - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();

		ctx.lineWidth = 3;
		ctx.strokeStyle = "rgba(100, 120, 140, 0.4)";
		ctx.stroke();

		ctx.globalAlpha = user.building.output > 0 ? 1 : 0.3;

		if (img) ctx.drawImage(img, x, y, w, h);
		ctx.globalAlpha = 1;

		const txt = "x" + user.building.output;

		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";

		ctx.font = "700 22px lexend";
		const offsetX = x + w - 32 - ctx.measureText(txt).width / 2;
		const offsetY = y + h - 16;

		ctx.strokeText(txt, offsetX, offsetY);
		ctx.fillText(txt, offsetX, offsetY);

		ctx.restore();
	}

	setup_html() {
		try {
			this.html.market = document.querySelector(".market");
			this.html.quest = document.querySelector(".quest");
			this.html.recipe = document.querySelector(".recipe");
			this.html.settings = document.querySelector(".settings");
			this.html.teams = document.querySelector(".teams");

			if (!this.html.market || !this.html.quest || !this.html.recipe || !this.html.settings || !this.html.teams) setTimeout(this.setup_html.bind(this), 1e3);
		} catch {
			setTimeout(this.setup_html.bind(this), 1e3);
		}
	}

	create_button(x: number, y: number, w: number, h: number, e: (e?: MouseEvent) => void, e2?: (e?: MouseEvent) => void, type?: "inv" | "craft" | "UI" | "build" | null, item?: number) {
		this.buttons.set(this.buttons_ids++, { x1: x, y1: y, x2: x + w, y2: y + h, action: e, action2: e2 || e, type, item });
	}

	set_buttons() {
		if (!this.changed) return;
		this.buttons.clear();
		this.buttons_ids = 0;
		const buttons: { x: number; y: number; w: number; h: number; item?: number; type?: "inv" | "craft" | "UI" | "build"; e: (e?: MouseEvent) => void; e2?: (e?: MouseEvent) => void }[] = [];

		// inventory
		let slot_x = 0;
		let w = 75;
		let h = 75;
		let gap = 15;
		const totalWidth = w * user.inv.max + gap * (user.inv.max - 1);
		const inv = Array(...user.inv.items);

		for (let i = 0; i < user.inv.max; i++) {
			const x = (user.screenW! - totalWidth) / 2 + slot_x - this.translate.x;
			const y = user.screenH! - 50 - h - this.translate.y;
			slot_x += w + gap;

			buttons.push({ x, y, w, h, type: "inv", item: inv[i] ? inv[i][0] : -1, e: () => (inv[i] ? (user.building.open && user.building.type == ITEMS.CHEST ? client.put_item(inv[i][0]) : client.select_inv(inv[i][0])) : null) });
		}

		// crafting
		const max_btns_col = 4;

		for (let i = 0; i < user.craftables.length; i++) {
			let x = 0,
				y = 0,
				w = 75,
				h = 75,
				gap = 15,
				padding = 40;

			x = Math.floor(i / max_btns_col);
			y = i % max_btns_col;

			buttons.push({
				x: padding + x * w + x * gap,
				y: padding + y * h + y * gap,
				w,
				h,
				item: user.craftables[i].id,
				type: "craft",
				e: () => Crafting.craft.end < user.timestamp && client.send_craft(user.craftables[i].id, user.craftables[i].d),
			});
		}

		// building
		if (user.building.open) {
			const p = 20;
			const g = 15;

			const x = 20 + p;
			const y = 450 + p;

			const w = 75;
			const h = 75;
			let i = 0;

			switch (user.building.type) {
				case ITEMS.EXTRACTOR_MACHINE_STONE:
				case ITEMS.EXTRACTOR_MACHINE_GOLD:
				case ITEMS.EXTRACTOR_MACHINE_DIAMOND:
				case ITEMS.EXTRACTOR_MACHINE_AMETHYST:
				case ITEMS.EXTRACTOR_MACHINE_REIDITE:
				case ITEMS.WINDMILL:
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.put_item(IDS.wheat, user.put_amount) });
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.take_item() });
					break;
				case ITEMS.FURNACE:
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.put_item(IDS.wood, user.put_amount) });
				case ITEMS.CHEST:
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.take_item() });
					break;
				case ITEMS.BREAD_OVEN:
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.put_item(IDS.wood, user.put_amount) });
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.put_item(IDS.flour, user.put_amount) });
					buttons.push({ x: x + i++ * (w + g), y, w, h, type: "build", item: -1, e: () => client.take_item() });
					break;
			}
		}

		// UI

		w = 50;
		h = 50;
		let x = innerWidth - 270 - w * 1.5,
			y = 40;

		const fns = [
			{
				e: () => {
					UI.html.recipe?.classList.toggle("active");
					mouse.can_click = !UI.html.recipe?.classList.contains("active");
				},
				// e2: () => UI.html.recipe?.classList.remove("active"),
			},
			{
				e: () => {
					UI.html.quest?.classList.toggle("active");
					mouse.can_click = !UI.html.quest?.classList.contains("active");
				},
				// e2: () => UI.html.quest?.classList.remove("active"),
			},
			{
				e: () => {
					UI.html.settings?.classList.toggle("active");
					mouse.can_click = !UI.html.settings?.classList.contains("active");
				},
				// e2: () => UI.html.settings?.classList.remove("active"),
			},
			{
				e: () => {
					UI.html.teams?.classList.toggle("active");
					mouse.can_click = !UI.html.teams?.classList.contains("active");
				},
				// e2: () => UI.html.teams?.classList.remove("active"),
			},
		];

		for (let i = 0; i < fns.length; i++) buttons.push({ x, y: y + i * (h + 10) - h / 2, w, h, e: fns[i].e });

		for (const b of buttons) this.create_button(b.x, b.y, b.w, b.h, b.e, b.e2, b.type, b.item);
	}
}

export const UI = new _UI();
UI.setup_html.bind(UI)();
