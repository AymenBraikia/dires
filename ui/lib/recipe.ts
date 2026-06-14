import { user } from "@/app/classes/user";
import { IDS } from "@/app/variables/vars";

const name_to_id_map = new Map<string, number>([
	["water_bottle", IDS.water_bottle],
	["bread", IDS.bread],
	["sandwich", IDS.sandwich],
	["cookies", IDS.cookies],
	["cookedMeat", IDS.cookedMeat],
	["cookedFish", IDS.cookedFish],
	["aloeVeraSeeds", IDS.aloeVeraSeeds],
	["berrySeeds", IDS.berrySeeds],
	["wheatSeeds", IDS.wheatSeeds],
	["pumpkinSeeds", IDS.pumpkinSeeds],
	["carrotSeeds", IDS.carrotSeeds],
	["tomatoSeeds", IDS.tomatoSeeds],
	["garlicSeeds", IDS.garlicSeeds],
	["watermelonSeeds", IDS.watermelonSeeds],
	["book", IDS.book],
	["pitchfork", IDS.pitchfork],
	["goldPitchfork", IDS.goldPitchfork],
	["wateringCan", IDS.wateringCan],
	["filledWateringCan", IDS.filledWateringCan],
	["bucket", IDS.bucket],
	["wrench", IDS.wrench],
	["machete", IDS.machete],
	["woodenPickaxe", IDS.woodenPickaxe],
	["stonePickaxe", IDS.stonePickaxe],
	["stoneHammer", IDS.stoneHammer],
	["stoneShovel", IDS.stoneShovel],
	["goldPickaxe", IDS.goldPickaxe],
	["goldHammer", IDS.goldHammer],
	["goldShovel", IDS.goldShovel],
	["diamondPickaxe", IDS.diamondPickaxe],
	["diamondHammer", IDS.diamondHammer],
	["diamondShovel", IDS.diamondShovel],
	["amethystPickaxe", IDS.amethystPickaxe],
	["amethystHammer", IDS.amethystHammer],
	["amethystShovel", IDS.amethystShovel],
	["reiditePickaxe", IDS.reiditePickaxe],
	["reiditeHammer", IDS.reiditeHammer],
	["reiditeShovel", IDS.reiditeShovel],
	["superHammer", IDS.superHammer],
	["stoneSword", IDS.stoneSword],
	["stoneSpear", IDS.stoneSpear],
	["stoneAxe", IDS.stoneAxe],
	["goldSword", IDS.goldSword],
	["goldSpear", IDS.goldSpear],
	["goldAxe", IDS.goldAxe],
	["diamondSword", IDS.diamondSword],
	["diamondSpear", IDS.diamondSpear],
	["diamondAxe", IDS.diamondAxe],
	["amethystSword", IDS.amethystSword],
	["amethystSpear", IDS.amethystSpear],
	["amethystAxe", IDS.amethystAxe],
	["reiditeSword", IDS.reiditeSword],
	["reiditeSpear", IDS.reiditeSpear],
	["reiditeAxe", IDS.reiditeAxe],
	["demonicSword", IDS.demonicSword],
	["demonicSpear", IDS.demonicSpear],
	["demonicAxe", IDS.demonicAxe],
	["satanSword", IDS.satanSword],
	["satanSpear", IDS.satanSpear],
	["satanAxe", IDS.satanAxe],
	["stoneHelmet", IDS.stoneHelmet],
	["goldHelmet", IDS.goldHelmet],
	["diamondHelmet", IDS.diamondHelmet],
	["amethystHelmet", IDS.amethystHelmet],
	["reiditeHelmet", IDS.reiditeHelmet],
	["demonicHelmet", IDS.demonicHelmet],
	["satanHelmet", IDS.satanHelmet],
	["amethystProtection", IDS.amethystProtection],
	["reiditeProtection", IDS.reiditeProtection],
	["emeraldProtection", IDS.emeraldProtection],
	["crownOfLife", IDS.crownOfLife],
	["crownOfLuck", IDS.crownOfLuck],
	["crownOfAngel", IDS.crownOfAngel],
	["divingMask", IDS.divingMask],
	["divingSuit", IDS.divingSuit],
	["earmuffs", IDS.earmuffs],
	["chapka", IDS.chapka],
	["capAndScarf", IDS.capAndScarf],
	["furHat", IDS.furHat],
	["hood", IDS.hood],
	["peasantsTunic", IDS.peasantsTunic],
	["winterHood", IDS.winterHood],
	["winterPeasantsTunic", IDS.winterPeasantsTunic],
	["explorersHat", IDS.explorersHat],
	["ninjaOutfit", IDS.ninjaOutfit],
	["pilot_hat", IDS.pilot_hat],
	["woodenWall", IDS.woodenWall],
	["woodenDoor", IDS.woodenDoor],
	["woodenSpike", IDS.woodenSpike],
	["stoneWall", IDS.stoneWall],
	["stoneDoor", IDS.stoneDoor],
	["stoneSpike", IDS.stoneSpike],
	["goldWall", IDS.goldWall],
	["goldDoor", IDS.goldDoor],
	["goldSpike", IDS.goldSpike],
	["diamondWall", IDS.diamondWall],
	["diamondDoor", IDS.diamondDoor],
	["diamondSpike", IDS.diamondSpike],
	["amethystWall", IDS.amethystWall],
	["amethystDoor", IDS.amethystDoor],
	["amethystSpike", IDS.amethystSpike],
	["reiditeWall", IDS.reiditeWall],
	["reiditeDoor", IDS.reiditeDoor],
	["reiditeSpike", IDS.reiditeSpike],
	["campfire", IDS.campfire],
	["bigFire", IDS.bigFire],
	["furnace", IDS.furnace],
	["workbench", IDS.workbench],
	["chest", IDS.chest],
	["well", IDS.well],
	["resurrectionStone", IDS.resurrectionStone],
	["emeraldMachine", IDS.emeraldMachine],
	["bridge", IDS.bridge],
	["roof", IDS.roof],
	["bed", IDS.bed],
	["tower", IDS.tower],
	["plantPlot", IDS.plantPlot],
	["windmill", IDS.windmill],
	["breadOven", IDS.breadOven],
	["paper", IDS.paper],
	["bottle", IDS.bottle],
	["lock", IDS.lock],
	["key", IDS.key],
	["bandage", IDS.bandage],
]);

export interface CraftingRecipe {
	id: number;
	d: number;
	r: {
		res: number[];
		b: boolean;
		w: boolean;
		f: boolean;
	}[];
}

export const craftingRecipes: CraftingRecipe[] = [];

const init_recipes = async () => {
	const recipes = await (await fetch("/recipe.json")).json();

	for (const item_name in recipes) {
		const recipe = recipes[item_name];
		recipe.id = name_to_id_map.get(item_name);

		craftingRecipes.push(recipe);
	}
};
init_recipes();

export function getRecipeById(itemId: number): CraftingRecipe | undefined {
	for (const recipe of craftingRecipes) if (recipe.id == itemId) return recipe;
	return undefined;
}

// export function getRecipesByCategory(category: CraftingRecipe["category"]): CraftingRecipe[] {
// 	const results: CraftingRecipe[] = [];
// 	for (const recipe of craftingRecipes) recipe.category == category && results.push(recipe);
// 	return results;
// }

export function canCraftItem(recipe: CraftingRecipe, inventory: Map<number, number>): boolean {
	for (const r of recipe.r) {
		let can = true;
		if ((r.w && !user.water) || (r.f && !user.fire) || (r.b && !user.bench)) continue;

		for (let i = 0; i < r.res.length; i += 2) {
			const resource_id = r.res[i],
				required_amount = r.res[+1];
			if ((inventory.get(resource_id) || 0) < required_amount) {
				can = false;
				break;
			}
		}

		if (can) return true;
	}

	return false;
}

export function getCraftableItems(inventory: Map<number, number>): CraftingRecipe[] {
	const amounts: number[] = [];
	for (const slot of inventory) amounts.push(slot[1]);

	return craftingRecipes.filter((recipe) => canCraftItem(recipe, inventory));
}
