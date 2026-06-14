import { Utils } from "../utils";
import { client } from "./client";
import { UI } from "./ui";
import { user } from "./user";
import { getSprite } from "../variables/vars";

class Mouse {
	can_click: boolean;
	is_set: boolean;
	drag_id: number;
	can?: HTMLCanvasElement;

	constructor() {
		this.can_click = true;
		this.is_set = false;
		this.drag_id = -1;
	}

	mouseUp(e: MouseEvent) {
		if (!user.alive || e.button != 0) return;

		if (!this.can_click) {
			for (const [, b] of UI.buttons)
				if (e.x >= b.x1 && e.y >= b.y1 && e.x <= b.x2 && e.y <= b.y2)
					if (this.drag_id < 0 || this.drag_id == b.item) {
						this.drag_id = -1;
						return b.action();
					} else if (b.type == "inv" && b.item && this.drag_id > -1) user.inv.swap(this.drag_id, b.item);

			return;
		}

		client.stop_attack();

		let btn;

		for (const [, b] of UI.buttons)
			if (e.x >= b.x1 && e.y >= b.y1 && e.x <= b.x2 && e.y <= b.y2)
				if (this.drag_id < 0 || this.drag_id == b.item) {
					this.drag_id = -1;
					return b.action();
				} else if (b.type == "inv" && b.item && this.drag_id > -1) user.inv.swap(this.drag_id, b.item);
				else btn = b;

		this.drag_id = -1;
	}

	mouseDown(e: MouseEvent) {
		if (!user.alive || e.button != 0 || !this.can_click) return;

		let btn;

		for (const [, b] of UI.buttons) if (b.x1 <= e.x && b.y1 <= e.y && b.x2 >= e.x && b.y2 >= e.y) btn = b;

		if (user.select.id > 2 && !btn) return client.send_build(user.select.id);
		if (!btn) return client.send_attack();
		if (btn.type == "inv") return (this.drag_id = btn.item || -1);
	}

	right_click(e: MouseEvent) {
		e.preventDefault();
		if (!user.alive || e.button != 2 || !this.can_click) return;

		for (const [, b] of UI.buttons)
			if (e.x >= b.x1 && e.y >= b.y1 && e.x <= b.x2 && e.y <= b.y2) {
				if (b.type == "inv" && b.item) return UI.skip_drop_prompt ? client.drop_all(b.item) : this.DropPrompt(b.item);
				return b.action2();
			}
	}

	private DropPrompt(itemId: number) {
		document.getElementById("drop-prompt-overlay")?.remove();

		const overlay = document.createElement("div");
		overlay.id = "drop-prompt-overlay";
		overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:10000;";

		const container = document.createElement("div");
		container.id = "drop-prompt";
		Object.assign(container.style, {
			background: "#3b2a0f",
			border: "2px solid #6b4b1e",
			borderRadius: "12px",
			padding: "16px 20px",
			color: "#fff",
			fontFamily: "lexend, sans-serif",
			boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
			minWidth: "340px",
			maxWidth: "420px",
			textAlign: "center",
		});

		// ── Item icon ──────────────────────────────────────────
		const iconWrap = document.createElement("div");
		iconWrap.style.cssText = "display:flex;justify-content:center;margin-bottom:8px;";

		const iconCanvas = document.createElement("canvas");
		iconCanvas.width = 64;
		iconCanvas.height = 64;
		iconCanvas.style.cssText = "border-radius:12px;background:#4a3615;";

		const img = getSprite(itemId);
		const ictx = iconCanvas.getContext("2d");
		if (ictx && img?.width) {
			const scale = Math.min((iconCanvas.width * 0.8) / img.width, (iconCanvas.height * 0.8) / img.height);
			const sw = img.width * scale;
			const sh = img.height * scale;
			ictx.drawImage(img, (iconCanvas.width - sw) / 2, (iconCanvas.height - sh) / 2, sw, sh);
		}
		iconWrap.appendChild(iconCanvas);

		// ── Title ──────────────────────────────────────────────
		const title = document.createElement("div");
		title.textContent = "DO YOU REALLY WANT TO THROW THIS ITEM";
		Object.assign(title.style, {
			fontSize: "18px",
			fontWeight: "800",
			letterSpacing: "0.5px",
			margin: "8px 0 12px",
			textTransform: "uppercase",
		});

		// ── Buttons ────────────────────────────────────────────
		const btnRow = document.createElement("div");
		btnRow.style.cssText = "display:flex;gap:10px;justify-content:center;margin-bottom:12px;";

		const mkBtn = (label: string, onClick: () => void) => {
			const btn = document.createElement("button");
			btn.textContent = label;
			Object.assign(btn.style, {
				background: UI.clrs.primary,
				border: `2px solid ${UI.clrs.secondary}`,
				color: "#fff",
				borderRadius: "8px",
				padding: "8px 14px",
				cursor: "pointer",
				fontSize: "14px",
				fontWeight: "700",
				textTransform: "uppercase",
			});
			btn.onmouseenter = () => (btn.style.filter = "brightness(1.15)");
			btn.onmouseleave = () => (btn.style.filter = "none");
			btn.onclick = () => {
				onClick();
				overlay.remove();
			};
			return btn;
		};

		// ── "Don't show again" checkbox ────────────────────────
		const cbWrap = document.createElement("label");
		cbWrap.style.cssText = "display:flex;align-items:center;gap:10px;color:#fff;font-size:13px;user-select:none;";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.style.cssText = "width:18px;height:18px;accent-color:#8b6b2f;";

		const cbText = document.createElement("span");
		cbText.textContent = "DO NOT SHOW THIS MESSAGE AGAIN";

		const saveSkip = () => {
			if (!checkbox.checked) return;
			// user.skipDropPrompt = true;
			// user.dropPromptDefault = default_;
			UI.skip_drop_prompt = true;
		};

		btnRow.appendChild(
			mkBtn("1 ITEM", () => {
				client.drop_one(itemId);
				saveSkip();
			}),
		);
		btnRow.appendChild(
			mkBtn("ALL ITEMS", () => {
				client.drop_all(itemId);
				saveSkip();
			}),
		);
		btnRow.appendChild(
			mkBtn("NO", () => {
				/* just close */
			}),
		);

		cbWrap.appendChild(checkbox);
		cbWrap.appendChild(cbText);

		container.appendChild(iconWrap);
		container.appendChild(title);
		container.appendChild(btnRow);
		container.appendChild(cbWrap);

		overlay.appendChild(container);
		document.body.appendChild(overlay);

		overlay.addEventListener("mousedown", (ev) => {
			if (ev.target === overlay) overlay.remove();
		});
	}

	is_in_slot(e: { x: number; y: number }) {
		for (let i = 0; i < UI.slots.length; i++) {
			const slot = UI.slots[i];
			if (slot.x1 <= e.x && slot.x2 >= e.x && slot.y1 <= e.y && slot.y2 >= e.y && Array(user.inv.items)[slot.i]) return slot.i;
		}
		return false;
	}

	is_in_ui_icon(e: { x: number; y: number }) {
		for (let i = 0; i < UI.icons.length; i++) {
			const icon = {
				x1: innerWidth - 270 - 75,
				y1: 15 + 60 * i,
				x2: innerWidth - 295,
				y2: 65 + 60 * i,
			};
			if (icon.x1 <= e.x && icon.x2 >= e.x && icon.y1 <= e.y && icon.y2 >= e.y) return i;
		}
		return false;
	}

	mouseMove(e: MouseEvent) {
		if (!this.can || !user.me) return;

		let btn;
		for (const [, b] of UI.buttons)
			if (b.x1 <= e.x && b.y1 <= e.y && b.x2 >= e.x && b.y2 >= e.y) {
				btn = b;
				break;
			}

		if (btn) this.can.style.cursor = "url('/cursor/hand.cur'), pointer";
		else "url('/cursor/arrow.cur'), auto";

		const angle = Utils.get_std_angle(e, { x: user.me!.x + user.cam.x, y: user.me!.y + user.cam.y });
		user.me!.angle = angle;
		client.send_angle(angle);
	}

	init(can: HTMLCanvasElement) {
		this.can = can;
		document.addEventListener("contextmenu", (e) => e.preventDefault());

		document.addEventListener("auxclick", this.right_click.bind(this));

		document.addEventListener("mousedown", this.mouseDown.bind(this));
		document.addEventListener("mouseup", this.mouseUp.bind(this));
		document.addEventListener("mousemove", this.mouseMove.bind(this));
		this.is_set = true;
	}
}

const mouse = new Mouse();
export default mouse;
