import { user } from "../classes/user";
import { world } from "../classes/world";
import { IDS, ITEMS, getSprite, ghostSprite } from "../variables/vars";

interface SkinImages {
	body: HTMLImageElement;
	hand: HTMLImageElement;
	bag: HTMLImageElement;
}
const skinCache = new Map<number, SkinImages>();

function getSkin(index: number): SkinImages {
	if (skinCache.has(index)) return skinCache.get(index)!;

	const n = index + 1; // skin files are 1-indexed: skin1.png, skin2.png …
	const load = (src: string) => {
		const img = new Image();
		img.src = src;
		return img;
	};

	const images: SkinImages = {
		body: load(`/skins/skin${n}.png`),
		hand: load(`/skins/hand${n}.png`),

		bag: load(`/skins/bag.png`), // bag is shared across skins
	};
	skinCache.set(index, images);
	return images;
}

// ─────────────────────────────────────────────────────────────────
class Player {
	type: number;
	name: string;
	angle: number;
	skin: number;
	accessory: number;
	book: number;
	bag: number;
	id: number;
	x: number;
	y: number;
	helmet: number;
	right: number;

	handOffset: { x: number; y: number };
	hit: {
		update: (dt: number) => void;
		angle: number;
		max: number;
		last: number;
		delay: number;
		duration: number;
		start: number;
		progress: number;
		cooldown: number;
		active: boolean;
		wait: boolean;
	};

	attack?: boolean;
	heal?: boolean;
	starve?: boolean;
	thirst?: boolean;
	damaged?: boolean;
	cold?: boolean;
	opacityTransition: number;
	stateOpacity: number;
	stateImg: number | null;

	animation?: boolean;
	ghost?: boolean;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	chatMessage?: string;
	chatTimestamp?: number;

	constructor(
		name: string,
		angle: number,
		skin: number,
		accessory: number,
		book: number,
		bag: number,
		x: number,
		y: number,
		helmet: number,
		right: number,
		id: number,
		attack?: boolean,
		heal?: boolean,
		starve?: boolean,
		thirst?: boolean,
		damaged?: boolean,
		cold?: boolean,
		ghost?: boolean,
		animation?: boolean,
	) {
		this.type = ITEMS.PLAYERS;
		this.name = name;
		this.angle = angle;
		this.animation = animation;
		this.skin = skin;
		this.accessory = accessory;
		this.book = book;
		this.bag = bag;
		this.helmet = helmet;
		this.right = right;
		this.ghost = ghost;
		this.attack = attack;
		this.heal = heal;
		this.starve = starve;
		this.thirst = thirst;
		this.damaged = damaged;
		this.cold = cold;
		this.x = x || 0;
		this.y = y || 0;
		this.stateImg = null;
		this.stateOpacity = 0;
		this.opacityTransition = 0.05;
		this.handOffset = { x: 35, y: 0 };
		this.id = id;
		this.canvas = document.querySelector("canvas")!;
		this.ctx = this.canvas.getContext("2d")!;
		this.hit = {
			update: this.hitAnim,
			angle: 0,
			max: Math.PI * 0.5,
			last: 0,
			delay: 0,
			duration: 700,
			start: 0,
			progress: 0,
			cooldown: 200,
			active: false,
			wait: false,
		};

		world.units[ITEMS.PLAYERS].set(id, this);
		world.fast_units.set(id, this);
	}

	draw(dt: number) {
		if (!this.ctx) return;

		const scaling = 0.7;
		const spriteW = 80;
		const spriteH = 80;
		const centerX = user.cam.x + this.x;
		const centerY = user.cam.y + this.y;
		const skinImages = getSkin(this.skin);
		const skinSprite = this.ghost ? ghostSprite : skinImages.body;

		this.ctx.save();
		if (this.ghost) this.ctx.globalAlpha = 0.5;
		if (user.night) this.ctx.filter = "brightness(0.4) contrast(1.2)";

		this.ctx.translate(centerX, centerY);
		this.ctx.rotate(this.angle - Math.PI / 2);
		this.ctx.drawImage(skinSprite!, -spriteW / 2, -spriteH / 2, spriteW, spriteH);

		// Ghost: just draw name and bail
		if (this.ghost) {
			this.ctx.restore();
			this.ctx.fillStyle = "white";
			this.ctx.strokeStyle = "black";
			this.ctx.font = "700 20px lexend";
			const tw = this.ctx.measureText(this.name).width;
			this.ctx.fillText(this.name, this.x + user.cam.x - tw / 2, this.y + user.cam.y - spriteH / 2 - 20);
			return;
		}

		// ── Left hand ──────────────────────────────────────────
		const hand = skinImages.hand;
		const handSize = 30;
		this.ctx.drawImage(hand, 35, 0, handSize, handSize);
		this.ctx.save();

		this.attack && !this.hit.wait && (this.hit.active = true);
		if (this.hit.active) {
			this.hitAnim(dt);
			this.ctx.rotate(-this.hit.angle);
		}

		// ── Held item (right hand) ─────────────────────────────
		if (this.right > -1) {
			const item = getSprite(this.right);
			if (item?.width && item?.height) {
				if ([IDS.goldPitchfork, IDS.pitchfork].includes(this.right)) {
					const sf = 2.2;
					const w = item.width * 0.6 * scaling * sf;
					const h = item.height * 0.6 * scaling * sf;
					this.ctx.drawImage(item, -w / 2 - this.handOffset.x - 15, -25 * scaling - this.handOffset.y + 10, w, h);
				} else if ([IDS.stoneSpear, IDS.goldSpear, IDS.diamondSpear, IDS.amethystSpear, IDS.reiditeSpear, IDS.demonicSpear, IDS.satanSpear].includes(this.right)) {
					const sf = 1.6;
					const w = 256 * 0.6 * scaling * sf;
					const h = 384 * 0.6 * scaling * sf;
					this.ctx.drawImage(item, -w / 2 - this.handOffset.x - 15, -25 * scaling - this.handOffset.y - 25, w, h);
				} else if ([IDS.stoneAxe, IDS.goldAxe, IDS.diamondAxe, IDS.amethystAxe, IDS.reiditeAxe, IDS.demonicAxe, IDS.satanAxe].includes(this.right)) {
					const sf = 1.3;
					const w = item.width * 0.6 * scaling * sf;
					const h = item.height * 0.6 * scaling * sf;
					this.ctx.drawImage(item, -w / 2 - this.handOffset.x - 15, -25 * scaling - this.handOffset.y - 10, w, h);
				} else {
					const sf = Math.min(400 / item.width, 400 / item.height);
					const w = item.width * 0.6 * scaling * sf;
					const h = item.height * 0.6 * scaling * sf;

					this.ctx.drawImage(item, -w / 2 - this.handOffset.x - 15, -25 * scaling - this.handOffset.y - 10, w * 1, h * 1);
				}
			}
		}

		// ── Right hand ─────────────────────────────────────────
		this.ctx.drawImage(hand, 50 * -2 + this.handOffset.x, -this.handOffset.y, handSize, handSize);
		this.ctx.restore();

		// ── State effect (heal / damage / etc.) ────────────────
		if (this.stateImg !== null) {
			const stateSprite = getSprite(this.stateImg);
			if (stateSprite) {
				this.ctx.globalAlpha = this.stateOpacity;
				this.ctx.drawImage(stateSprite, user.cam.x + this.x, user.cam.y + this.y);
			}
		}

		// ── Bag ────────────────────────────────────────────────
		if (this.bag) {
			const bag = skinImages.bag;
			if (bag && !this.helmet) {
				const bagW = 137 * scaling;
				const bagH = 157 * scaling;
				this.ctx.drawImage(bag, -bagW / 2, -spriteH + 5, bagW, bagH);
			}
		}

		// ── Helmet ─────────────────────────────────────────────
		if (this.helmet > -1) {
			const clothe = getSprite(this.helmet);
			if (clothe?.width && clothe?.height) {
				const sf = Math.min(spriteW / clothe.width, spriteH / clothe.height) + 0.17;
				const w = clothe.width * sf;
				const h = clothe.height * sf;
				this.ctx.drawImage(clothe, -w / 2, -h / 2, w, h);
			}
		}

		// ── Name tag ───────────────────────────────────────────
		this.ctx.restore();
		this.ctx.fillStyle = "white";
		this.ctx.strokeStyle = "black";
		this.ctx.font = "700 20px lexend";
		const tw = this.ctx.measureText(this.name).width;
		this.ctx.fillText(this.name, this.x + user.cam.x - tw / 2, this.y + user.cam.y - spriteH / 2 - 20);

		// ── Chat bubble ────────────────────────────────────────
		if (this.chatMessage && this.chatTimestamp) {
			const messageAge = user.timestamp - this.chatTimestamp;

			if (messageAge < 5000) {
				this.ctx.save();
				this.ctx.globalAlpha = 0.7;
				this.ctx.font = "700 16px lexend";

				const chatWidth = this.ctx.measureText(this.chatMessage).width + 20;
				const chatHeight = 30;
				const chatX = this.x + user.cam.x - chatWidth / 2;
				const chatY = this.y + user.cam.y - spriteH / 2 - 80;

				this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
				this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
				this.ctx.lineWidth = 2;
				this.ctx.beginPath();
				this.ctx.roundRect(chatX, chatY, chatWidth, chatHeight, 8);
				this.ctx.fill();
				this.ctx.stroke();

				this.ctx.fillStyle = "white";
				this.ctx.fillText(this.chatMessage, chatX + 10, chatY + 20);
				this.ctx.restore();
			} else {
				this.chatMessage = undefined;
				this.chatTimestamp = undefined;
			}
		}

		if (this.ghost) this.ctx.globalAlpha = 1;
	}

	hitAnim(dt: number) {
		if (!this.hit.active) return;

		this.hit.progress += dt / (this.hit.duration - this.hit.cooldown);

		if (this.hit.progress >= 1) {
			this.hit.progress = 0;
			this.hit.angle = 0;
			this.hit.active = false;
			this.hit.wait = true;
			setTimeout(() => (this.attack ? ((this.hit.active = true), (this.hit.wait = false)) : (this.hit.wait = false)), this.hit.cooldown);
			return;
		}

		// ease-out: fast swing, slow return
		const eased =
			this.hit.progress < 0.4
				? this.hit.progress / 0.4 // fast forward swing
				: 1 - (this.hit.progress - 0.4) / 0.6; // slow return

		this.hit.angle = eased * this.hit.max;
	}

	setChatMessage(message: string) {
		this.chatMessage = message;
		this.chatTimestamp = user.timestamp;
	}

	drawEffect() {
		const states: (keyof this & ("heal" | "thirst" | "starve" | "damaged" | "cold"))[] = ["heal", "thirst", "starve", "damaged", "cold"];

		for (const state of states) {
			if (!this[state]) continue;

			if (!this.stateOpacity) this.stateOpacity = 0;
			else this.stateOpacity += this.opacityTransition;

			if (this.stateOpacity >= 1) this.opacityTransition = -0.05;
			if (this.stateOpacity < 0) {
				this.opacityTransition = 0.05;
				this.stateOpacity = 0;
				(this[state] as boolean) = false;
			}
			break; // only one state effect at a time
		}
	}
}

export default Player;
