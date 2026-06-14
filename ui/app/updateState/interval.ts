import { client } from "../classes/client";
import keyboard from "../classes/keyboard";
import { UI } from "../classes/ui";
import { user } from "../classes/user";
import { world } from "../classes/world";
import Player from "../entities/player";
import { IDS, getSprite } from "../variables/vars";

function snapToGrid(value: number, gridSize: number = 100): number {
	return Math.round(value / gridSize) * gridSize;
}

export function game_interval(ctx: CanvasRenderingContext2D) {
	Object.defineProperty(window, "user", {
		value: user,
		writable: true,
		configurable: true,
		enumerable: true,
	});
	Object.defineProperty(window, "world", {
		value: world,
		writable: true,
		configurable: true,
		enumerable: true,
	});
	Object.defineProperty(window, "client", {
		value: client,
		writable: true,
		configurable: true,
		enumerable: true,
	});

	if (!user.alive) return;
	user.cam.update();

	const me = user.me || (world.fast_units.get(user.id)! as Player);
	if (!me) return;

	// ── Building preview ──────────────────────────────────────
	if (user.select.id > 2) {
		const img = getSprite(user.select.id);

		if (img) {
			ctx.save();

			if (user.select.gridMode) {
				const buildX = snapToGrid(me.x + 120 * Math.cos(me.angle));
				const buildY = snapToGrid(me.y + 120 * Math.sin(me.angle));
				ctx.translate(user.cam.x + buildX, user.cam.y + buildY);
				ctx.rotate((user.select.rotation * Math.PI) / 180);
			} else {
				ctx.translate(user.cam.x + me.x, user.cam.y + me.y);
				ctx.rotate(me.angle);
				ctx.translate(120, 0);
				ctx.rotate((user.select.rotation * Math.PI) / 180);
			}

			const scaleFactor = Math.min(400 / img.width, 400 / img.height);
			const w = img.width * 0.6 * scaleFactor * 0.8;
			const h = img.height * 0.6 * scaleFactor * 0.8;

			if (user.select.gridMode) {
				ctx.globalAlpha = 0.6;
				ctx.strokeStyle = "#00ff88";
				ctx.lineWidth = 3;
				ctx.strokeRect(-w / 2, -h / 2, w, h);
			} else {
				ctx.globalAlpha = 0.4;
			}

			ctx.drawImage(img, -w / 2, -h / 2, w, h);
			ctx.globalAlpha = 1;
			ctx.restore();
		}
	}

	// ── Movement input ────────────────────────────────────────
	let move = 0;
	if (keyboard.is_left()) move += 1;
	if (keyboard.is_right()) move += 2;
	if (keyboard.is_bottom()) move += 4;
	if (keyboard.is_top()) move += 8;

	if (user.previous_move !== move) {
		client.send_move(move);
		user.previous_move = move;
	}
}
