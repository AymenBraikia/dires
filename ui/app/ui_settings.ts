export let settings_config: config_type = {
	panel_opacity: 1,
	safe_cancel: true,
	safe_drop: true,
	colored_inv: true,
	quality: "high",
	auto_ice: true,
	auto_craft: false,
	auto_put: false,
	auto_take: false,
	auto_eat: true,
	auto_book: true,
	keyboard: "qwerty",
	put_amount: 10,
};

export function set_settings(): boolean {
	try {
		const v = read_settings();
		if (v) settings_config = v;
		return true;
	} catch {
		setTimeout(set_settings, 1000);
	}
	return false;
}

function read_settings() {
	const val = window.localStorage.getItem("settings");
	return val ? JSON.parse(val) : false;
}

export function save_settings() {
	localStorage.setItem("settings", JSON.stringify(settings_config));
}

export interface config_type {
	panel_opacity: number;
	safe_cancel: boolean;
	safe_drop: boolean;
	colored_inv: boolean;
	quality: "high" | "low";
	auto_ice: boolean;
	auto_craft: boolean;
	auto_put: boolean;
	auto_take: boolean;
	auto_eat: boolean;
	auto_book: boolean;
	keyboard: "qwerty" | "azerty";
	put_amount: number;
}
