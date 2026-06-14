import { client } from "../classes/client";
import { user } from "../classes/user";
import { world } from "../classes/world";
import { Utils } from "../utils";
import { buildings, ITEMS, MACHINE_SPRITES, MOB_SPRITES } from "../variables/vars";
import { States } from "./STATE";

// Preload the two sprites this class needs directly
// const ovenOnImg = new Image();
// ovenOnImg.src = MACHINE_SPRITES.ovenOn;

// const plantGrownImg = new Image();
// plantGrownImg.src = MOB_SPRITES.pumpkin_grown;

export class Entity {
	x: number;
	y: number;
	type: number;
	angle: number;
	id: number;
	delta: number;
	increament?: number;
	amount?: number;
	hp?: number;
	img?: any;
	plant: boolean;
	state: number;

	draw2?: (ctx: CanvasRenderingContext2D) => void;

	constructor(type: number, x: number, y: number, angle: number, id: number, amount?: number, hp?: number, state?: number) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.angle = angle;
		this.id = id;
		this.amount = amount;
		this.hp = hp;
		this.state = 0;
		this.delta = 0;
		this.plant = [ITEMS.SEED, ITEMS.WHEAT_SEED, ITEMS.PUMPKIN_SEED, ITEMS.CARROT_SEED, ITEMS.TOMATO_SEED, ITEMS.GARLIC_SEED, ITEMS.WATERMELON_SEED, ITEMS.ALOE_VERA_SEED].includes(this.type);

		if ([ITEMS.BREAD_OVEN, ITEMS.FURNACE, ITEMS.FIRE, ITEMS.BIG_FIRE].includes(type)) {
			this.increament = 0.1;
			this.delta = 100;

			let len: number, max_len: number, min_len: number;

			switch (type) {
				case ITEMS.BREAD_OVEN:
					len = 50;
					min_len = 30;
					max_len = 70;
					break;
				case ITEMS.FURNACE:
					len = 125;
					min_len = 100;
					max_len = 150;
					break;
				default:
					len = 110;
					min_len = 90;
					max_len = 130;
					this.state = States.building.on;
					break;
			}

			this.draw2 = (ctx: CanvasRenderingContext2D) => {
				if (this.state == States.building.off) return;
				this.delta = user.timestamp - this.delta;

				ctx.beginPath();
				ctx.fillStyle = "rgba(255, 193, 7, 0.2)";
				ctx.arc(0, 0, len, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();

				ctx.beginPath();
				ctx.fillStyle = "rgba(255, 193, 7, 0.1)";
				ctx.arc(0, 0, len + 70, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();

				if (this.delta > 30) {
					len += this.increament!;
					if (len > max_len) this.increament = -Math.abs(this.increament!);
					if (len < min_len) this.increament = Math.abs(this.increament!);
				}
			};
		}

		world.fast_units.get(id) ? null : world.fast_units.set(id, this);
		world.units[type].set(id, this);
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!user.me) return;
		if (Math.abs(this.x - user.me!.x) > user.screenW! + 100 || Math.abs(this.y - user.me!.y) > user.screenH! + 100) client.kill(this.id);
		ctx.save();
		ctx.translate(this.x + user.cam.x, this.y + user.cam.y);
		ctx.rotate(this.angle);

		if (user.night) {
			ctx.filter = "brightness(0.4) contrast(1.2)";
		}

		if (!this.img) {
			this.img = this.plant ? Utils.get_sprite2(this.type) : Utils.get_sprite(this.type);
		}

		if (this.img) {
			const scaleFactor = Math.min(400 / this.img.width, 400 / this.img.height);
			const w = this.img.width * 0.6 * scaleFactor * 0.8;
			const h = this.img.height * 0.6 * scaleFactor * 0.8;

			// if (this.is_on) {
			// 	switch (this.type) {
			// 		case ITEMS.BREAD_OVEN:
			// 			this.delta! += this.increament!;
			// 			if (this.delta! > 20 || this.delta! < -20) this.increament! *= -1;

			// 			ctx.drawImage(ovenOnImg, -w / 2, -h / 2, w, h);

			// 			ctx.fillStyle = "rgb(249 169 54 / 20%)";
			// 			ctx.beginPath();
			// 			ctx.arc(0, 15, 75 + (this.delta || 0), 0, Math.PI * 2);
			// 			ctx.fill();

			// 			ctx.fillStyle = "rgb(249 169 54 / 10%)";
			// 			ctx.beginPath();
			// 			ctx.arc(0, 15, 100 + (this.delta || 0), 0, Math.PI * 2);
			// 			ctx.fill();

			// 			break;
			// 	}
			// 	ctx.restore();
			// 	return;
			// }

			this.draw2?.(ctx);

			ctx.drawImage(this.img, -w / 2, -h / 2, w, h);
		}

		ctx.restore();
	}
}
