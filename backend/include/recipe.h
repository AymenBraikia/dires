// crafting.h
#pragma once
#include <unordered_map>
#include <vector>
#include <iostream>
#include "ids.h"
#include "nlohmann/json.hpp"

struct Recipe
{
    int duration;
    struct Variant
    {
        std::vector<std::pair<int, int>> ingredients; // {item_id, amount}
        bool bench;
        bool water;
        bool fire;
    };
    std::vector<Variant> variants;
};

// name → id lookup (inverse of ItemIds enum)
inline std::unordered_map<std::string, int> build_name_to_id()
{
    return {
        {"water_bottle", ItemIds::water_bottle},
        {"bread", ItemIds::bread},
        {"sandwich", ItemIds::sandwich},
        {"cookies", ItemIds::cookies},
        {"cookedMeat", ItemIds::cookedMeat},
        {"cookedFish", ItemIds::cookedFish},
        {"aloeVeraSeeds", ItemIds::aloeVeraSeeds},
        {"berrySeeds", ItemIds::berrySeeds},
        {"wheatSeeds", ItemIds::wheatSeeds},
        {"pumpkinSeeds", ItemIds::pumpkinSeeds},
        {"carrotSeeds", ItemIds::carrotSeeds},
        {"tomatoSeeds", ItemIds::tomatoSeeds},
        {"garlicSeeds", ItemIds::garlicSeeds},
        {"watermelonSeeds", ItemIds::watermelonSeeds},
        {"book", ItemIds::book},
        {"pitchfork", ItemIds::pitchfork},
        {"goldPitchfork", ItemIds::goldPitchfork},
        {"wateringCan", ItemIds::wateringCan},
        {"filledWateringCan", ItemIds::filledWateringCan},
        {"bucket", ItemIds::bucket},
        {"wrench", ItemIds::wrench},
        {"machete", ItemIds::machete},
        {"woodenPickaxe", ItemIds::woodenPickaxe},
        {"stonePickaxe", ItemIds::stonePickaxe},
        {"stoneHammer", ItemIds::stoneHammer},
        {"stoneShovel", ItemIds::stoneShovel},
        {"goldPickaxe", ItemIds::goldPickaxe},
        {"goldHammer", ItemIds::goldHammer},
        {"goldShovel", ItemIds::goldShovel},
        {"diamondPickaxe", ItemIds::diamondPickaxe},
        {"diamondHammer", ItemIds::diamondHammer},
        {"diamondShovel", ItemIds::diamondShovel},
        {"amethystPickaxe", ItemIds::amethystPickaxe},
        {"amethystHammer", ItemIds::amethystHammer},
        {"amethystShovel", ItemIds::amethystShovel},
        {"reiditePickaxe", ItemIds::reiditePickaxe},
        {"reiditeHammer", ItemIds::reiditeHammer},
        {"reiditeShovel", ItemIds::reiditeShovel},
        {"superHammer", ItemIds::superHammer},
        {"stoneSword", ItemIds::stoneSword},
        {"stoneSpear", ItemIds::stoneSpear},
        {"stoneAxe", ItemIds::stoneAxe},
        {"goldSword", ItemIds::goldSword},
        {"goldSpear", ItemIds::goldSpear},
        {"goldAxe", ItemIds::goldAxe},
        {"diamondSword", ItemIds::diamondSword},
        {"diamondSpear", ItemIds::diamondSpear},
        {"diamondAxe", ItemIds::diamondAxe},
        {"amethystSword", ItemIds::amethystSword},
        {"amethystSpear", ItemIds::amethystSpear},
        {"amethystAxe", ItemIds::amethystAxe},
        {"reiditeSword", ItemIds::reiditeSword},
        {"reiditeSpear", ItemIds::reiditeSpear},
        {"reiditeAxe", ItemIds::reiditeAxe},
        {"demonicSword", ItemIds::demonicSword},
        {"demonicSpear", ItemIds::demonicSpear},
        {"demonicAxe", ItemIds::demonicAxe},
        {"satanSword", ItemIds::satanSword},
        {"satanSpear", ItemIds::satanSpear},
        {"satanAxe", ItemIds::satanAxe},
        {"stoneHelmet", ItemIds::stoneHelmet},
        {"goldHelmet", ItemIds::goldHelmet},
        {"diamondHelmet", ItemIds::diamondHelmet},
        {"amethystHelmet", ItemIds::amethystHelmet},
        {"reiditeHelmet", ItemIds::reiditeHelmet},
        {"demonicHelmet", ItemIds::demonicHelmet},
        {"satanHelmet", ItemIds::satanHelmet},
        {"amethystProtection", ItemIds::amethystProtection},
        {"reiditeProtection", ItemIds::reiditeProtection},
        {"emeraldProtection", ItemIds::emeraldProtection},
        {"crownOfLife", ItemIds::crownOfLife},
        {"crownOfLuck", ItemIds::crownOfLuck},
        {"crownOfAngel", ItemIds::crownOfAngel},
        {"divingMask", ItemIds::divingMask},
        {"divingSuit", ItemIds::divingSuit},
        {"earmuffs", ItemIds::earmuffs},
        {"chapka", ItemIds::chapka},
        {"capAndScarf", ItemIds::capAndScarf},
        {"furHat", ItemIds::furHat},
        {"hood", ItemIds::hood},
        {"peasantsTunic", ItemIds::peasantsTunic},
        {"winterHood", ItemIds::winterHood},
        {"winterPeasantsTunic", ItemIds::winterPeasantsTunic},
        {"explorersHat", ItemIds::explorersHat},
        {"ninjaOutfit", ItemIds::ninjaOutfit},
        {"pilot_hat", ItemIds::pilot_hat},
        {"woodenWall", ItemIds::woodenWall},
        {"woodenDoor", ItemIds::woodenDoor},
        {"woodenSpike", ItemIds::woodenSpike},
        {"stoneWall", ItemIds::stoneWall},
        {"stoneDoor", ItemIds::stoneDoor},
        {"stoneSpike", ItemIds::stoneSpike},
        {"goldWall", ItemIds::goldWall},
        {"goldDoor", ItemIds::goldDoor},
        {"goldSpike", ItemIds::goldSpike},
        {"diamondWall", ItemIds::diamondWall},
        {"diamondDoor", ItemIds::diamondDoor},
        {"diamondSpike", ItemIds::diamondSpike},
        {"amethystWall", ItemIds::amethystWall},
        {"amethystDoor", ItemIds::amethystDoor},
        {"amethystSpike", ItemIds::amethystSpike},
        {"reiditeWall", ItemIds::reiditeWall},
        {"reiditeDoor", ItemIds::reiditeDoor},
        {"reiditeSpike", ItemIds::reiditeSpike},
        {"campfire", ItemIds::campfire},
        {"bigFire", ItemIds::bigFire},
        {"furnace", ItemIds::furnace},
        {"workbench", ItemIds::workbench},
        {"chest", ItemIds::chest},
        {"well", ItemIds::well},
        {"resurrectionStone", ItemIds::resurrectionStone},
        {"emeraldMachine", ItemIds::emeraldMachine},
        {"bridge", ItemIds::bridge},
        {"roof", ItemIds::roof},
        {"bed", ItemIds::bed},
        {"tower", ItemIds::tower},
        {"plantPlot", ItemIds::plantPlot},
        {"windmill", ItemIds::windmill},
        {"breadOven", ItemIds::breadOven},
        {"paper", ItemIds::paper},
        {"bottle", ItemIds::bottle},
        {"lock", ItemIds::lock},
        {"key", ItemIds::key},
        {"bandage", ItemIds::bandage},
    };
}

// item_id → Recipe
inline std::unordered_map<int, Recipe> RECIPES;

inline void init_recipes(const nlohmann::json &j)
{
    auto name_to_id = build_name_to_id();
    for (auto &[name, data] : j.items())
    {
        auto it = name_to_id.find(name);
        if (it == name_to_id.end())
        {
            std::cout << "unknown item: " << name << "\n";
            continue; // unknown item, skip
        }

        int item_id = it->second;
        Recipe recipe;
        recipe.duration = (int)data["d"];

        for (auto &r : data["r"])
        {
            Recipe::Variant v;
            v.bench = r["b"];
            v.water = r["w"];
            v.fire = r["f"];

            auto &res = r["res"];
            for (int i = 0; i + 1 < res.size(); i += 2)
                v.ingredients.push_back({res[i], res[i + 1]});

            recipe.variants.push_back(v);
        }

        RECIPES[item_id] = recipe;
    }
}
