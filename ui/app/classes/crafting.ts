import { canCraftItem, CraftingRecipe } from "../../lib/recipe";
import { config } from "../../lib/ids";
import { getSprite } from "../variables/vars";
import { user } from "./user";
import { UI } from "./ui";

class _Crafting {
	isOpen: boolean;
	craft: {
		id: number;
		start: number;
		duration: number;
		end: number;
		p: number;
	};

	constructor() {
		this.isOpen = true;
		this.craft = {
			id: -1,
			start: -1,
			duration: -1,
			end: -1,
			p: 0,
		};
	}

	toggle() {
		// no
	}

	updateCraftingSlots() {
		// 0
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this.isOpen || !user.alive) return;

		if (user.me)
			if (this.craft.end > user.timestamp) {
				ctx.beginPath();
				const rad = 20;
				const x = user.cam.x + user.me.x;
				const y = user.cam.y + user.me.y - 100;
				const elapsed = user.timestamp - this.craft.start;
				this.craft.p = elapsed / this.craft.duration;

				const txt = Math.ceil((this.craft.duration - elapsed) / 1000).toString();

				ctx.font = "700 16px lexend";
				const text_size = ctx.measureText(txt);
				ctx.fillText(txt, x - text_size.width / 2, y + 8);

				ctx.arc(x, y, rad, 0, Math.PI * 2 * this.craft.p);

				ctx.strokeStyle = "#049f64";
				ctx.lineWidth = 5;
				ctx.stroke();
			} else
				this.craft = {
					id: -1,
					start: -1,
					duration: -1,
					end: -1,
					p: 0,
				};

		if (user.craftables.length <= 0) return;

		const itemWidth = 75;
		const itemHeight = 75;
		const gap = 15;
		const maxItemsPerCol = 4;
		const padding = 20;

		const itemsPerCol = Math.min(user.craftables.length, maxItemsPerCol);
		const cols = Math.ceil(user.craftables.length / maxItemsPerCol);

		const panelWidth = cols * itemWidth + (cols - 1) * gap + padding * 2;
		const panelHeight = itemsPerCol * itemHeight + (itemsPerCol - 1) * gap + padding * 2;

		const panelX = 20;
		const panelY = 20;

		ctx.save();
		ctx.globalAlpha = 0.9;

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

		const rotaters = new Set([
			config.IDS.stoneSword,
			config.IDS.goldSword,
			config.IDS.diamondSword,
			config.IDS.stoneSpear,
			config.IDS.goldSpear,
			config.IDS.diamondSpear,
			config.IDS.stoneAxe,
			config.IDS.goldAxe,
			config.IDS.diamondAxe,
			config.IDS.stoneHammer,
			config.IDS.goldHammer,
			config.IDS.diamondHammer,
			config.IDS.woodenPickaxe,
			config.IDS.stonePickaxe,
			config.IDS.goldPickaxe,
			config.IDS.stoneShovel,
			config.IDS.goldShovel,
		]);

		for (let i = 0; i < user.craftables.length; i++) {
			const recipe = user.craftables[i];
			const row = i % maxItemsPerCol;
			const col = Math.floor(i / maxItemsPerCol);

			const x = panelX + padding + col * (itemWidth + gap);
			const y = panelY + padding + row * (itemHeight + gap);

			const radius = 10;
			ctx.fillStyle = "#080c0f";
			ctx.strokeStyle = "#182b3a";
			ctx.lineWidth = 4;

			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + itemWidth - radius, y);
			ctx.arcTo(x + itemWidth, y, x + itemWidth, y + radius, radius);
			ctx.lineTo(x + itemWidth, y + itemHeight - radius);
			ctx.arcTo(x + itemWidth, y + itemHeight, x + itemWidth - radius, y + itemHeight, radius);
			ctx.lineTo(x + radius, y + itemHeight);
			ctx.arcTo(x, y + itemHeight, x, y + itemHeight - radius, radius);
			ctx.lineTo(x, y + radius);
			ctx.arcTo(x, y, x + radius, y, radius);
			ctx.closePath();

			ctx.stroke();
			ctx.fill();


			if (recipe.id == this.craft.id && this.craft.end > user.timestamp) {
				ctx.fillStyle = "#049f6499";
				const height = itemHeight * this.craft.p;

				ctx.beginPath();
				ctx.moveTo(x + radius, y);
				ctx.lineTo(x + itemWidth - radius, y);
				ctx.arcTo(x + itemWidth, y, x + itemWidth, y + radius, radius);
				ctx.lineTo(x + itemWidth, y + height - radius);
				ctx.arcTo(x + itemWidth, y + height, x + itemWidth - radius, y + height, radius);
				ctx.lineTo(x + radius, y + height);
				ctx.arcTo(x, y + height, x, y + height - radius, radius);
				ctx.lineTo(x, y + radius);
				ctx.arcTo(x, y, x + radius, y, radius);
				ctx.closePath();
				ctx.fill();
			}

			ctx.lineWidth = 3;
			ctx.strokeStyle = canCraftItem(recipe, user.inv.items) ? "rgba(0, 255, 152, 0.6)" : "rgba(255, 100, 100, 0.6)";
			ctx.stroke();

			const img = getSprite(recipe.id) ?? UI.create_item_button(recipe.id),
				w = 65,
				h = 65;

			if (img) {
				ctx.save();
				ctx.translate(x + itemWidth / 2, y + itemHeight / 2);
				if (rotaters.has(recipe.id)) ctx.rotate(Math.PI * 1.15);
				ctx.drawImage(img, -w / 2, -h / 2, w, h);
				ctx.restore();
			}
		}
		ctx.restore();
	}
}

export const Crafting = new _Crafting();
