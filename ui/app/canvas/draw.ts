import { world } from "../classes/world";
import { user } from "../classes/user";
import { ITEMS } from "../variables/vars";
import { IDS, getSprite, WORLD_SPRITES } from "../variables/vars";
import { game_interval } from "../updateState/interval";
import { UI } from "../classes/ui";
import keyboard from "../classes/keyboard";
import { rain } from "../effects/rain.min";
import { blizzard } from "../effects/blizard.min";
import { sandstorm } from "../effects/sandstorm.min";
import { client } from "../classes/client";
import { Entity } from "../entities/entity";
import Player from "../entities/player";

const PI = Math.PI;

// ─── Gauge icons ────────────────────────────────────────────────
const gaugeIcons: { [key: string]: HTMLImageElement } = {};
const iconPaths = {
	health: "/gauges/heart_gauge.png",
	hunger: "/gauges/pizza_gauge.png",
	cold: "/gauges/snowflake_gauge.png",
	water: "/gauges/water_drop_gauge.png",
	oxygen: "/gauges/oxygen_gauge.png",
};

if (typeof window !== "undefined") {
	Object.entries(iconPaths).forEach(([key, path]) => {
		const img = new Image();
		img.src = path;
		gaugeIcons[key] = img;
	});
}

export const worldImgs: Record<keyof typeof WORLD_SPRITES, HTMLImageElement> = {} as any;
if (typeof window !== "undefined") {
	for (const [key, src] of Object.entries(WORLD_SPRITES) as [keyof typeof WORLD_SPRITES, string][]) {
		const img = new Image();
		img.src = src;
		worldImgs[key] = img;
	}
}

let last_tick = Date.now();
// ─────────────────────────────────────────────────────────────────
function draw(can: HTMLCanvasElement) {
	const ctx = can.getContext("2d");
	if (!ctx) return;

	const now = Date.now();
	const dt = now - last_tick;
	last_tick = now;

	ctx.clearRect(0, 0, can.width, can.height);

	requestAnimationFrame(() => draw(can));

	if (!user.alive) return draw_fake_world(ctx);

	ctx.fillStyle = "#00b1ff"; // ocean
	ctx.fillRect(0, 0, can.width, can.height);

	for (let i = 0; i < world.biomes.length; i++) {
		const biome = world.biomes[i]!;
		switch (biome.type) {
			case "forest":
				ctx.fillStyle = "#0b442d";
				break;
			case "winter":
				ctx.fillStyle = "#fff";
				break;
			case "desert":
				ctx.fillStyle = "#ffdfa4";
				break;
			case "lava":
				ctx.fillStyle = "#180000";
				break;
			case "island": {
				ctx.fillStyle = "#ffdfa4";
				const cx = biome.x1 + user.cam.x;
				const cy = biome.y1 + user.cam.y;
				ctx.beginPath();
				ctx.ellipse(cx, cy, biome.w! * 50, biome.h! * 50, 0, 0, 2 * PI);
				ctx.fill();
				continue;
			}
			case "lake": {
				ctx.fillStyle = "#3fc4ff";
				const cx = biome.x1 + user.cam.x;
				const cy = biome.y1 + user.cam.y;
				ctx.beginPath();
				ctx.ellipse(cx, cy, biome.w! * 50, biome.h! * 50, 0, 0, 2 * PI);
				ctx.fill();
				continue;
			}
		}
		ctx.fillRect(biome.x1 + user.cam.x, biome.y1 + user.cam.y, biome.x2 - biome.x1, biome.y2 - biome.y1);
	}

	if (user.night) {
		ctx.fillStyle = "rgba(0, 20, 40, 0.6)";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}

	if (dt > 1000) client.refresh_units();

	user.timestamp = now;

	game_interval(ctx);
	draw_world(ctx, dt);

	if (!rain.is_set) rain.init(ctx);
	if (user.rain) rain.draw.bind(rain)();

	if (!blizzard.is_set) blizzard.init(ctx);
	if (user.blizzard) blizzard.draw.bind(blizzard)();

	if (!sandstorm.is_set) sandstorm.init(ctx);
	if (user.sandstorm) sandstorm.draw.bind(sandstorm)();

	UI.draw.bind(UI)(ctx);
	drawUI(ctx);
}

// ─────────────────────────────────────────────────────────────────
function draw_world(ctx: CanvasRenderingContext2D, dt: number) {
	const drawAll = (key: number) => {
		const units = world.units[key];
		for (const [, u] of units as Map<number, Entity>) u.draw(ctx);
	};
	const me = world.fast_units.get(user.id)! as Player;
	user.me = me;

	drawAll(ITEMS.BRIDGE);
	drawAll(ITEMS.PLOT);

	drawAll(ITEMS.BED);

	drawAll(ITEMS.BOX);

	drawAll(ITEMS.BREAD_OVEN);
	drawAll(ITEMS.WINDMILL);
	drawAll(ITEMS.WELL);

	drawAll(ITEMS.CHEST);
	drawAll(ITEMS.RESURRECTION);
	drawAll(ITEMS.WORKBENCH);

	const seeds = [
		world.units[ITEMS.SEED],
		world.units[ITEMS.WHEAT_SEED],
		world.units[ITEMS.PUMPKIN_SEED],
		world.units[ITEMS.CARROT_SEED],
		world.units[ITEMS.TOMATO_SEED],
		world.units[ITEMS.GARLIC_SEED],
		world.units[ITEMS.WATERMELON_SEED],
		world.units[ITEMS.ALOE_VERA_SEED],
	];
	// for (let i = 0; i < seeds.length; i++) seeds[i].draw(ctx);
	for (const s of seeds) for (const [, seed] of s as Map<number, Entity>) seed.draw(ctx);

	for (const [, p] of world.units[ITEMS.PLAYERS] as Map<number, Player>) p.draw(dt);

	drawAll(ITEMS.WALL);
	drawAll(ITEMS.STONE_WALL);
	drawAll(ITEMS.GOLD_WALL);
	drawAll(ITEMS.DIAMOND_WALL);
	drawAll(ITEMS.AMETHYST_WALL);
	drawAll(ITEMS.REIDITE_WALL);

	drawAll(ITEMS.WOOD_DOOR);
	drawAll(ITEMS.STONE_DOOR);
	drawAll(ITEMS.GOLD_DOOR);
	drawAll(ITEMS.DIAMOND_DOOR);
	drawAll(ITEMS.AMETHYST_DOOR);
	drawAll(ITEMS.REIDITE_DOOR);

	drawAll(ITEMS.SPIKE);
	drawAll(ITEMS.STONE_SPIKE);
	drawAll(ITEMS.GOLD_SPIKE);
	drawAll(ITEMS.DIAMOND_SPIKE);
	drawAll(ITEMS.EMERALD_MACHINE);
	drawAll(ITEMS.AMETHYST_SPIKE);
	drawAll(ITEMS.REIDITE_SPIKE);

	drawAll(ITEMS.WOOD_TOWER);

	drawAll(ITEMS.WOLF);
	drawAll(ITEMS.SPIDER);
	drawAll(ITEMS.RABBIT);

	drawAll(ITEMS.BIG_FIRE);
	drawAll(ITEMS.FIRE);
	drawAll(ITEMS.FURNACE);

	drawAll(ITEMS.ROOF);
	// ── Resources ──────────────────────────────────────────────
	const cameraLeft = me.x - ctx.canvas.width / 2 - 200;
	const cameraRight = me.x + ctx.canvas.width / 2 + 200;
	const cameraTop = me.y - ctx.canvas.height / 2 - 200;
	const cameraBottom = me.y + ctx.canvas.height / 2 + 200;

	for (const [, resource] of world.resources) {
		if (resource.x < cameraLeft || resource.x > cameraRight || resource.y < cameraTop || resource.y > cameraBottom) continue;

		resource.draw.bind(resource)(ctx);
	}
}

// ─────────────────────────────────────────────────────────────────
const fake_world = [
	{ type: "tree", x: 0.2, y: 0.2, angle: PI * 0, s: 8, responsive: true },
	{ type: "tree", x: 0.5, y: 0.9, angle: PI * 0, s: 6, responsive: true },

	{ type: "stone", x: 0, y: 0.7, angle: PI * (Math.random() * 4 - 2), s: 0, responsive: true },
	{ type: "stone", x: 0.1, y: 0.4, angle: PI * (Math.random() * 4 - 2), s: 3, responsive: true },
	{ type: "stone", x: 0.9, y: 0.7, angle: PI * (Math.random() * 4 - 2), s: 4, responsive: true },

	{ type: "gold", x: 0, y: 0.2, angle: PI * (Math.random() * 4 - 2), s: 0, responsive: true },
	{ type: "gold", x: 0.3, y: 0.9, angle: PI * (Math.random() * 4 - 2), s: 2, responsive: true },
	{ type: "gold", x: 0.8, y: 0.05, angle: PI * (Math.random() * 4 - 2), s: 3, responsive: true },
	{ type: "gold", x: 0.7, y: 0.3, angle: PI * (Math.random() * 4 - 2), s: 4, responsive: true },
	{ type: "gold", x: 0.98, y: 0.2, angle: PI * (Math.random() * 4 - 2), s: 0, responsive: true },
	{ type: "gold", x: 1, y: 0.7, angle: PI * (Math.random() * 4 - 2), s: 0, responsive: true },
	{ type: "gold", x: 0.8, y: 0.98, angle: PI * (Math.random() * 4 - 2), s: 0, responsive: true },

	{ type: "diamond", x: 50, y: 50, angle: (3 * PI) / 4, s: 2, responsive: false },
	{ type: "diamond", x: 0.95, y: 0.95, angle: (9 * PI) / 5, s: 9, responsive: true },
	{ type: "diamond", x: 0.98, y: 0.05, angle: (5 * PI) / 4, s: 4, responsive: true },
	{ type: "diamond", x: 0.03, y: 0.92, angle: PI / 4, s: 8, responsive: true },
];

function draw_fake_world(ctx: CanvasRenderingContext2D) {
	for (const res of fake_world) {
		const w = 180 + res.s * 20;
		const h = 180 + res.s * 20;
		const x = res.responsive ? ctx.canvas.width * res.x : res.x;
		const y = res.responsive ? ctx.canvas.height * res.y : res.y;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(res.angle);

		switch (res.type) {
			case "tree":
				ctx.drawImage(worldImgs.tree, -w / 2, -h / 2, w, h);
				break;
			case "stone":
				ctx.drawImage(worldImgs.stone, -w / 2, -h / 2, w, h);
				break;
			case "gold":
				ctx.drawImage(worldImgs.gold, -w / 2, -h / 2, w, h);
				break;
			case "diamond":
				ctx.drawImage(worldImgs.diamond, -w / 2, -h / 2, w, h);
				break;
		}
		ctx.restore();
	}
}

// ─────────────────────────────────────────────────────────────────
function drawMinimap(ctx: CanvasRenderingContext2D) {
	const minimapSize = 200;
	const padding = 20;
	const x = ctx.canvas.width - minimapSize - padding;
	const y = ctx.canvas.height - minimapSize - padding;

	ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
	ctx.fillRect(x, y, minimapSize, minimapSize);

	ctx.save();

	ctx.fillStyle = "#00b1ff"; // ocean
	ctx.fillRect(x + 2, y + 2, minimapSize - 4, minimapSize - 4);

	const scaleFactor = (minimapSize - 4) / world.size;

	for (let i = 0; i < world.biomes.length; i++) {
		const biome = world.biomes[i]!;
		switch (biome.type) {
			case "forest":
				ctx.fillStyle = "#0b442d";
				break;
			case "winter":
				ctx.fillStyle = "#fff";
				break;
			case "desert":
				ctx.fillStyle = "#ffdfa4";
				break;
			case "lava":
				ctx.fillStyle = "#180000";
				break;
			case "island": {
				ctx.fillStyle = "#ffdfa4";
				const cx = x + 2 + biome.x1 * scaleFactor;
				const cy = y + 2 + biome.y1 * scaleFactor;
				ctx.beginPath();
				ctx.ellipse(cx, cy, biome.w! * 50 * scaleFactor, biome.h! * 50 * scaleFactor, 0, 0, 2 * PI);
				ctx.fill();
				continue;
			}
			case "lake": {
				ctx.fillStyle = "#3fc4ff";
				const cx = x + 2 + biome.x1 * scaleFactor;
				const cy = y + 2 + biome.y1 * scaleFactor;
				ctx.beginPath();
				ctx.ellipse(cx, cy, biome.w! * 50 * scaleFactor, biome.h! * 50 * scaleFactor, 0, 0, 2 * PI);
				ctx.fill();
				continue;
			}
		}
		ctx.fillRect(x + 2 + biome.x1 * scaleFactor, y + 2 + biome.y1 * scaleFactor, (biome.x2 - biome.x1) * scaleFactor, (biome.y2 - biome.y1) * scaleFactor);
	}

	if (!user.minimapCache) {
		// Build the minimap once and cache it
		const can2 = document.createElement("canvas");
		can2.width = minimapSize;
		can2.height = minimapSize;
		const ctx2 = can2.getContext("2d")!;

		for (const [, resource] of world.resources) {
			const img = resource.minimap_img;
			if (!img) continue;

			const rx = Math.max(0, Math.min(1, resource.x / world.size)) * minimapSize;
			const ry = Math.max(0, Math.min(1, resource.y / world.size)) * minimapSize;

			ctx2.drawImage(img, rx, ry, 10, 10);
		}

		const cached = new Image(minimapSize, minimapSize);
		cached.src = can2.toDataURL();
		user.minimapCache = cached;
	} else {
		ctx.drawImage(user.minimapCache, x, y, minimapSize, minimapSize);

		if (user.me?.x && user.me?.y) {
			const px = x + Math.max(0, Math.min(1, user.me.x / world.size)) * minimapSize;
			const py = y + Math.max(0, Math.min(1, user.me.y / world.size)) * minimapSize;

			ctx.fillStyle = "orange";
			ctx.beginPath();
			ctx.arc(px, py, 6, 0, PI * 2);
			ctx.fill();
		}
	}

	ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
const last_vals: number[] = [1, 1, 1, 1, 1];
let diff = -0.035;

function drawGauges(ctx: CanvasRenderingContext2D) {
	const gauges = [
		{ name: "Health", o: "hp", value: user.gauges.hp, color: "#00c851", bgColor: "rgba(0, 200, 81, 0.2)", circleColor: "#2a2a2a", iconKey: "health" },
		{ name: "Hunger", o: "hunger", value: user.gauges.hunger, color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.2)", circleColor: "#2a2a2a", iconKey: "hunger" },
		{ name: "Cold", o: "cold", value: user.gauges.temprature, color: "#94ffff", bgColor: "rgba(59, 130, 246, 0.2)", circleColor: "#2a2a2a", iconKey: "cold" },
		{ name: "Water", o: "water", value: user.gauges.water, color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.2)", circleColor: "#2a2a2a", iconKey: "water" },
		{ name: "Oxygen", o: "oxygen", value: user.gauges.oxygen, color: "#42b0ff", bgColor: "rgba(16, 185, 129, 0.2)", circleColor: "#2a2a2a", iconKey: "oxygen" },
	];

	const gaugeWidth = 200;
	const gaugeHeight = 30;
	const gaugeSpacing = 20;
	const totalWidth = gaugeWidth * gauges.length + gaugeSpacing * (gauges.length - 1);
	const startX = (ctx.canvas.width - totalWidth) / 2;
	const startY = ctx.canvas.height - 65 - 75 - 65;

	for (let i = 0; i < gauges.length; i++) {
		const gauge = gauges[i];
		const x = startX + i * (gaugeWidth + gaugeSpacing);
		const y = startY;

		ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
		ctx.beginPath();
		ctx.roundRect(x - 16, y, gaugeWidth, gaugeHeight, 15);
		ctx.fill();

		ctx.fillStyle = gauge.bgColor;
		ctx.beginPath();
		ctx.roundRect(x - 16 + 2, y + 2, gaugeWidth - 4, gaugeHeight - 4, 13);
		ctx.fill();

		if (gauge.value < last_vals[i]) {
			last_vals[i] -= (last_vals[i] - gauge.value) * 0.05;
			if (gauge.value + 0.001 >= last_vals[i]) last_vals[i] = gauge.value;
		} else {
			last_vals[i] += (gauge.value - last_vals[i]) * 0.05;
			if (last_vals[i] + 0.001 >= gauge.value) last_vals[i] = gauge.value;
		}

		const fillWidth = (gaugeWidth - 4) * Math.max(0, Math.min(1, last_vals[i]));

		if (last_vals[i] <= 0.35) {
			if (user.timestamp - user.gauges.o.update > 10) {
				if (user.gauges.o[gauge.o] + diff > 1 || user.gauges.o[gauge.o] + diff < 0) diff *= -1;
				user.gauges.o[gauge.o] += diff;
				user.gauges.o.update = user.timestamp;
			}
		} else {
			user.gauges.o[gauge.o] = 100;
		}

		ctx.globalAlpha = user.gauges.o[gauge.o];

		if (fillWidth > 0) {
			ctx.fillStyle = gauge.color;
			ctx.beginPath();
			ctx.roundRect(x - 16 + 2, y + 2, fillWidth, gaugeHeight - 4, 13);
			ctx.fill();
		}

		ctx.globalAlpha = 1;

		ctx.fillStyle = gauge.circleColor;
		ctx.beginPath();
		ctx.arc(x, y + gaugeHeight / 2, 15, 0, PI * 2);
		ctx.fill();

		const icon = gaugeIcons[gauge.iconKey];
		if (icon?.complete) {
			ctx.drawImage(icon, x - icon.naturalWidth / 2, y + gaugeHeight / 2 - icon.naturalHeight / 2, icon.naturalWidth, icon.naturalHeight);
		}
	}

	ctx.textAlign = "left";
}

// ─────────────────────────────────────────────────────────────────
function drawChatInput(ctx: CanvasRenderingContext2D) {
	return;
	if (!keyboard.chatActive) return;

	const inputWidth = 400;
	const inputHeight = 40;
	const inputX = (ctx.canvas.width - inputWidth) / 2;
	const inputY = ctx.canvas.height / 2 + 80;

	ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
	ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.roundRect(inputX, inputY, inputWidth, inputHeight, 8);
	ctx.fill();
	ctx.stroke();

	ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
	ctx.font = "700 14px lexend";
	ctx.fillText("Press Enter to send, Escape to cancel", inputX + 10, inputY - 10);

	ctx.fillStyle = "white";
	ctx.font = "700 18px lexend";
	const displayText = keyboard.chatInput + "|";
	const textWidth = ctx.measureText(displayText).width;
	let textX = inputX + 10;
	if (textWidth > inputWidth - 20) textX = inputX + inputWidth - 10 - textWidth;

	// ctx.save();
	ctx.beginPath();
	ctx.rect(inputX + 5, inputY + 5, inputWidth - 10, inputHeight - 10);
	ctx.clip();
	ctx.fillText(displayText, textX, inputY + 25);
	// ctx.restore();
}
function drawAlerts(ctx: CanvasRenderingContext2D) {
	const m = user.check_msgs();
	if (!m) return;
	const x = ctx.canvas.width / 2,
		y = 80,
		f_in = 250,
		f_out = m.duration - f_in;

	if (user.timestamp - m.time <= f_in) ctx.globalAlpha = (user.timestamp - m.time) / f_in;
	else if (user.timestamp - m.time >= f_out) ctx.globalAlpha = 1 - (user.timestamp - m.time - f_out) / f_in;
	else ctx.globalAlpha = 1;

	ctx.fillStyle = "white";
	ctx.font = "700 28px lexend";
	const w = ctx.measureText(m.content).width;
	ctx.strokeText(m.content, x - w / 2, y);
	ctx.fillText(m.content, x - w / 2, y);
	ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────
function drawUI(ctx: CanvasRenderingContext2D) {
	drawGauges(ctx);
	drawMinimap(ctx);
	drawChatInput(ctx);
	drawAlerts(ctx);
}

export default draw;
