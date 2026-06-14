import { worldImgs } from "../canvas/draw";
import { user } from "../classes/user";
import { world } from "../classes/world";
import { Utils } from "../utils";
import { getSprite, IDS, ITEMS, WORLD_SPRITES } from "../variables/vars";

export class Plant {
	x: number;
	y: number;
	s: number;
	type: number;
	angle: number;
	id: number;
	amount: number;
	grown: boolean;
	watered: boolean;

	img: HTMLImageElement | null;
	fruit_img: HTMLImageElement | null;

	constructor(type: number, x: number, y: number, angle: number, id: number, grown: boolean, watered: boolean, amount: number) {
		this.x = x;
		this.y = y;
		this.id = id;
		this.type = type;
		this.angle = angle;
		this.amount = amount;
		this.grown = grown;
		this.watered = watered;
		this.s = 200;

		this.img = null;
		this.fruit_img = null;

		this.set_imgs(this.type);

		world.fast_units.set(id, this);
		world.units[type].set(id, this);
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!user.me || !this.img || !this.fruit_img) return;
		ctx.save();
		ctx.translate(this.x + user.cam.x, this.y + user.cam.y);
		ctx.rotate(this.angle);

		if (user.night) ctx.filter = "brightness(0.4) contrast(1.2)";

		const scaleFactor = Math.min(this.s / this.img.width, this.s / this.img.height);
		const w = this.img.width * scaleFactor;
		const h = this.img.height * scaleFactor;

		ctx.drawImage(this.img, -w / 2, -h / 2, w, h);

		if (this.type == ITEMS.SEED || this.type == ITEMS.TOMATO_SEED) {
			const offsets = [
				{ w: 25, h: 25, x: 20, y: 10 },
				{ w: 25, h: 25, x: -20, y: -20 },
				{ w: 25, h: 25, x: -10, y: 10 },
			];

			for (let j = 0; j < this.amount!; j++) {
				const pos = offsets[j];
				const sf = Math.min(this.s / this.fruit_img!.width, this.s / this.fruit_img!.height);
				const bw = pos.w * sf;
				const bh = pos.h * sf;
				ctx.drawImage(this.fruit_img!, -bw / 2 + pos.x, -bh / 2 + pos.y, bw, bh);
			}
		} else {
			const sf = Math.min((this.s - 50) / this.fruit_img!.width, (this.s - 50) / this.fruit_img!.height);
			const w = this.fruit_img.width * sf;
			const h = this.fruit_img.height * sf;

			ctx.drawImage(this.fruit_img!, -w / 2, -h / 2, w, h);
		}
		ctx.restore();
	}

	set_imgs(type: number) {
		const img = new Image();
		let fruit_img = new Image();

		switch (type) {
			case ITEMS.SEED:
				img.src = WORLD_SPRITES.bush;
				fruit_img = getSprite(IDS.berries)!;
				this.s = 100;
				break;

			case ITEMS.WHEAT_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img = getSprite(IDS.wheat)!;
				this.s = 100;
				break;

			case ITEMS.PUMPKIN_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img.src = WORLD_SPRITES.pumpkin_grown;
				this.s = 200;
				break;

			case ITEMS.CARROT_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img = getSprite(IDS.carrot)!;
				this.s = 100;
				break;

			case ITEMS.TOMATO_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img = getSprite(IDS.tomato)!;
				this.s = 150;
				break;

			case ITEMS.GARLIC_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img = getSprite(IDS.garlic)!;
				this.s = 150;
				break;

			case ITEMS.WATERMELON_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img = getSprite(IDS.watermelon)!;
				this.s = 200;
				break;

			case ITEMS.ALOE_VERA_SEED:
				img.src = this.grown ? WORLD_SPRITES.aloeVera_grown : WORLD_SPRITES.aloeVera;
				fruit_img = getSprite(IDS.aloeVera)!;
				this.s = 150;
				break;

			default:
				break;
		}
		this.img = img;
		this.fruit_img = fruit_img;
	}
}
