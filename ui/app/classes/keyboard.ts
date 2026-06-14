import { client } from "./client";
import { user } from "./user";

class Keyboard {
	keys: any;
	LEFT: string;
	RIGHT: string;
	TOP: string;
	BOTTOM: string;
	is_set: boolean;
	chatActive: boolean;
	chatInput: string;
	maxChatLength: number;
	onChatSubmit?: (message: string) => void;
	constructor() {
		this.keys = {};
		this.LEFT = "KeyA";
		this.RIGHT = "KeyD";
		this.TOP = "KeyW";
		this.BOTTOM = "KeyS";
		this.is_set = false;
		this.chatActive = false;
		this.chatInput = "";
		this.maxChatLength = 50;
	}
	keyUp(k: KeyboardEvent) {
		if (typeof window !== "undefined" && (window as any).__ADMIN_OPEN__) {
			return;
		}
		this.keys[k.code] = 0;
	}
	keyDown(k: KeyboardEvent) {
		if (typeof window !== "undefined" && (window as any).__ADMIN_OPEN__) {
			k.preventDefault();
			return;
		}
		if (!this.chatActive) {
			switch (k.code) {
				case "Digit1":
					if (Array(...user.inv.items)[0][0]) client.select_inv(Array(...user.inv.items)[0][0]);
					break;
				case "Digit2":
					if (Array(...user.inv.items)[1][0]) client.select_inv(Array(...user.inv.items)[1][0]);
					break;
				case "Digit3":
					if (Array(...user.inv.items)[2][0]) client.select_inv(Array(...user.inv.items)[2][0]);
					break;
				case "Digit4":
					if (Array(...user.inv.items)[3][0]) client.select_inv(Array(...user.inv.items)[3][0]);
					break;
				case "Digit5":
					if (Array(...user.inv.items)[4][0]) client.select_inv(Array(...user.inv.items)[4][0]);
					break;
				case "Digit6":
					if (Array(...user.inv.items)[5][0]) client.select_inv(Array(...user.inv.items)[5][0]);
					break;
				case "Digit7":
					if (Array(...user.inv.items)[6][0]) client.select_inv(Array(...user.inv.items)[6][0]);
					break;
				case "Digit8":
					if (Array(...user.inv.items)[7][0]) client.select_inv(Array(...user.inv.items)[7][0]);
					break;
				case "Digit9":
					if (Array(...user.inv.items)[8][0]) client.select_inv(Array(...user.inv.items)[8][0]);
					break;
				case "KeyR":
					if (user.select.id > 2) {
						user.select.rotation = (user.select.rotation + 90) % 360;
					}
					break;
				case "KeyG":
					if (user.select.id > 2) {
						user.select.gridMode = !user.select.gridMode;
					}
					break;

				default:
					break;
			}
		}

		if (k.code === "Enter") {
			if (this.chatActive) {
				if (this.chatInput.trim() && this.onChatSubmit) {
					this.onChatSubmit(this.chatInput.trim());
				}
				this.chatActive = false;
				this.chatInput = "";
				k.preventDefault();
				return;
			} else {
				this.chatActive = true;
				k.preventDefault();
				return;
			}
		}

		if (this.chatActive) {
			if (k.code === "Escape") {
				this.chatActive = false;
				this.chatInput = "";
				k.preventDefault();
				return;
			}

			if (k.code === "Backspace") {
				this.chatInput = this.chatInput.slice(0, -1);
				k.preventDefault();
				return;
			}

			if (k.key.length === 1 && this.chatInput.length < this.maxChatLength) {
				this.chatInput += k.key;
				k.preventDefault();
				return;
			}
		}

		if (!this.chatActive) {
			this.keys[k.code] = 1;
		}
	}

	is_left() {
		return this.keys[this.LEFT];
	}
	is_right() {
		return this.keys[this.RIGHT];
	}
	is_top() {
		return this.keys[this.TOP];
	}
	is_bottom() {
		return this.keys[this.BOTTOM];
	}

	set_qwerty() {
		this.LEFT = "keyA";
		this.RIGHT = "keyD";
		this.TOP = "keyW";
		this.BOTTOM = "keyS";
	}
	set_azerty() {
		this.LEFT = "keyQ";
		this.RIGHT = "keyD";
		this.TOP = "keyZ";
		this.BOTTOM = "keyS";
	}
	init() {
		document.addEventListener("keydown", this.keyDown.bind(this));
		document.addEventListener("keyup", this.keyUp.bind(this));
		this.is_set = true;
	}
}

const keyboard = new Keyboard();

export default keyboard;
