import { worldImgs } from "../canvas/draw";
import { user } from "../classes/user";
import { world } from "../classes/world";
import Player from "../entities/player";

class Blizard_System {
	ctx?: CanvasRenderingContext2D;
	max_drops: number;
	drops: rain_drop[];
	is_set: boolean;

	constructor() {
		this.max_drops = 500;
		this.drops = [];
		this.is_set = false;
	}

	draw() {
		let not_in_biome = true;

		for (let i = 0; i < world.biomes.length; i++) {
			const biome = world.biomes[i]!;
			if (biome.type != "winter") continue;

			if (user.me!.x + 400 > biome.x1 && user.me!.x < biome.x2 + 400 && user.me!.y + 400 > biome.y1 && user.me!.y < biome.y2 + 400) not_in_biome = false;
		}
		if (!this.ctx || not_in_biome) return;

		for (let i = 0; i < this.drops.length; i++) {
			const drop = this.drops[i];

			drop.y += drop.speed;
			drop.x += drop.speed / 10;
			// drop.opacity = (drop.y * 100) / (user.screenH! * 10);
			drop.opacity = drop.y / user.screenH! + 0.4;

			if (drop.y > user.screenH! || drop.x > user.screenW!) {
				drop.y = -30;
				drop.x = Math.random() * (user.screenW! * 1.1) - user.screenW! * 0.1;
				drop.length = Math.round(Math.random() * 10 + 5);
				drop.speed = Math.random() * 6 + 8;
			}
			// draw

			this.ctx.globalAlpha = drop.opacity;
			const img = worldImgs.snowflake;
			const w = img.width,
				h = img.height;
			this.ctx.drawImage(img, drop.x - w / 2, drop.y - h / 2, w, h);

			// this.ctx.strokeStyle = `rgba(100, 149, 237, ${drop.opacity})`;

			// this.ctx.beginPath();
			// this.ctx.lineWidth = 4;
			// this.ctx.moveTo(drop.x, drop.y);
			// this.ctx.lineTo(drop.x, drop.y + drop.length);
			// this.ctx.stroke();
		}
		this.ctx.globalAlpha = 1;
	}
	fade() {
		let done = true;

		const remaining: rain_drop[] = [];

		for (let i = 0; i < this.drops.length; i++)
			if (this.drops[i].opacity != 0) {
				done = false;
				remaining.push(this.drops[i]);
			}

		if (!this.ctx || done) return;

		requestAnimationFrame(this.fade.bind(this));

		for (let i = 0; i < remaining.length; i++) {
			const drop = remaining[i];

			drop.y += drop.speed;
			drop.x += drop.speed / 5;
			drop.opacity -= 0.01;

			if (drop.y > user.screenH! || drop.x > user.screenW!) drop.opacity = 0;

			// draw

			this.ctx.beginPath();
			this.ctx.arc(drop.x, drop.y, drop.length, 0, Math.PI * 2);
			this.ctx.fillStyle = `rgba(255, 255, 255, ${drop.opacity})`;
			this.ctx.fill();
		}
	}

	init(ctx: CanvasRenderingContext2D) {
		this.is_set = true;
		this.ctx = ctx;

		for (let i = 0; i < this.max_drops; i++) this.drops.push(new rain_drop(Math.random() * (user.screenW! * 1.1) - user.screenW! * 0.1, 0, 1, Math.random() * 5 + 5));
	}
}

class rain_drop {
	x: number;
	y: number;
	opacity: number;
	speed: number;
	length: number;
	constructor(x: number, y: number, opacity: number, speed: number) {
		this.x = x;
		this.y = y;
		this.opacity = opacity;
		this.speed = speed;
		this.length = Math.round(Math.random() * 3 + 2);
	}
}
export const blizzard = new Blizard_System();
