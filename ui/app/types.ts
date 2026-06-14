export interface player {
	draw: () => void;
	angle: number;
	name: string;
	book: number;
	right: number;
	helmet: number;
	skin: number;
	bag: number;
	id: number;
	y: number;
	x: number;
}

export type entity_unit = [number, number, number, number, number, number, number];
export type player_unit = [number, 0, number, number, number, string, number, number, number];
export type plant_unit = [number, number, number, number, number, number, 0 | 1, 0 | 1];

// export interface User {
//     draw: () => void;
//     cam: { x: number; y: number };
//     token: string;
//     token_id: string;
//     alive: boolean;
//     angle: number;
//     helmet: number;
//     skin: number;
//     bag: number;
// }
// export interface World {
//     transition: boolean;
//     time: number;
// }
