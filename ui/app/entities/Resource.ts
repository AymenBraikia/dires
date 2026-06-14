import { worldImgs } from "../canvas/draw";
import { client } from "../classes/client";
import { user } from "../classes/user";
import { world } from "../classes/world";
import { Utils } from "../utils";
import { getSprite, IDS } from "../variables/vars";

const resource_type_map = new Map<number, "tree" | "stone" | "gold" | "diamond" | "amethyst" | "reidite" | "emerald" | "cactus" | "bush">([]);

resource_type_map.set(0, "tree");
resource_type_map.set(1, "stone");
resource_type_map.set(2, "gold");
resource_type_map.set(3, "diamond");
resource_type_map.set(4, "amethyst");
resource_type_map.set(5, "reidite");
resource_type_map.set(6, "emerald");
resource_type_map.set(7, "cactus");
resource_type_map.set(8, "bush");

export class Resource {
	x: number;
	y: number;
	type: "tree" | "stone" | "gold" | "diamond" | "amethyst" | "reidite" | "emerald" | "cactus" | "bush";
	angle: number;
	size: number;
	id: number;
	amount: number | null;

	img: HTMLImageElement;
	minimap_img: HTMLImageElement;
	fruit_img?: HTMLImageElement;
	constructor(type: number, x: number, y: number, angle: number, id: number, size: number, amount?: number) {
		this.x = x;
		this.y = y;
		this.id = id;
		this.size = size;
		this.type = resource_type_map.get(type) || "tree";
		this.angle = angle;
		this.amount = amount || null;

		this.img = worldImgs[this.type];
		this.minimap_img = worldImgs[(this.type + "_mm") as "tree_mm" | "stone_mm" | "gold_mm" | "diamond_mm" | "amethyst_mm" | "reidite_mm" | "emerald_mm" | "cactus_mm" | "bush_mm"];

		world.resources.get(id) || world.resources.set(id, this);

		if (this.type == "bush") {
			this.fruit_img = getSprite(IDS.berries);

			this.draw = (ctx: CanvasRenderingContext2D) => {
				if (!user.me) return;
				if (Utils.dist({ x: this.x, y: this.y }, { x: user.me.x, y: user.me.y }) > user.screenW! + 500 || Utils.dist({ x: this.x, y: this.y }, { x: user.me!.x, y: user.me!.y }) > user.screenH! + 500) return;

				ctx.save();
				ctx.translate(this.x + user.cam.x, this.y + user.cam.y);
				ctx.rotate(this.angle);

				if (user.night) {
					ctx.filter = "brightness(0.4) contrast(1.2)";
				}

				const scaleFactor = Math.min(50 / this.img.width, 50 / this.img.height) * (this.size * 0.5 + 1);
				const w = this.img.width * scaleFactor;
				const h = this.img.height * scaleFactor;

				ctx.drawImage(this.img, -w / 2, -h / 2, w, h);

				const offsets = [
					{ w: 25, h: 25, x: 50, y: 50 },
					{ w: 25, h: 25, x: -50, y: -50 },
					{ w: 25, h: 25, x: 50, y: -50 },
					{ w: 25, h: 25, x: -50, y: 50 },
					{ w: 25, h: 25, x: 10, y: 0 },
					{ w: 25, h: 25, x: 70, y: 0 },
					{ w: 25, h: 25, x: -70, y: 0 },
				];

				for (let j = 0; j < this.amount!; j++) {
					const pos = offsets[j];
					const sf = Math.min(250 / this.fruit_img!.width, 250 / this.fruit_img!.height);
					const bw = pos.w * sf;
					const bh = pos.h * sf;
					ctx.drawImage(this.fruit_img!, -bw / 2 + pos.x, -bh / 2 + pos.y, bw, bh);
				}
				ctx.restore();
			};
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!user.me) return;
		if (Utils.dist({ x: this.x, y: this.y }, { x: user.me.x, y: user.me.y }) > user.screenW! + 500 || Utils.dist({ x: this.x, y: this.y }, { x: user.me!.x, y: user.me!.y }) > user.screenH! + 500) return;

		ctx.save();
		ctx.translate(this.x + user.cam.x, this.y + user.cam.y);
		ctx.rotate(this.angle);

		if (user.night) {
			ctx.filter = "brightness(0.4) contrast(1.2)";
		}

		if (this.img) {
			const scaleFactor = Math.min(200 / this.img.width, 200 / this.img.height);
			const w = this.img.width * scaleFactor * (1 + this.size / 3);
			const h = this.img.height * scaleFactor * (1 + this.size / 3);

			ctx.drawImage(this.img, -w / 2, -h / 2, w, h);
		}

		ctx.restore();
	}
}
