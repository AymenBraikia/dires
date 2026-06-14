#pragma once
#include <string>
#include <map>
#include <cstdint>
#include <variant>
#include "./ids.h"

int assign_resource_type(std::string type)
{
    int def = 0;
    static const std::map<std::string, int> types_map = {

        {"tree", 0},
        {"stone", 1},
        {"gold", 2},
        {"diamond", 3},
        {"amethyst", 4},
        {"reidite", 5},
        {"emerald", 6},
        {"bush", 7},
        {"cactus", 8},
    };

    auto it = types_map.find(type);
    if (it != types_map.end())
        return it->second;
    std::cout << type << " ";
    return def;
}
int assign_resource_radius(int size)
{
    int def = 100;
    static const std::map<int, int> types_map = {
        {1, 110},
        {2, 130},
        {3, 160},
    };

    auto it = types_map.find(size);
    if (it != types_map.end())
        return it->second;

    return def;
}

int assign_type(int id)
{
    static const std::map<int, int> types_map = {
        // Fires
        {ItemIds::campfire, ENTITY_TYPES::FIRE},
        {ItemIds::bigFire, ENTITY_TYPES::BIG_FIRE},

        // Crafting / utility
        {ItemIds::workbench, ENTITY_TYPES::WORKBENCH},
        {ItemIds::furnace, ENTITY_TYPES::FURNACE},
        {ItemIds::chest, ENTITY_TYPES::CHEST},
        {ItemIds::well, ENTITY_TYPES::WELL},
        {ItemIds::windmill, ENTITY_TYPES::WINDMILL},
        {ItemIds::breadOven, ENTITY_TYPES::BREAD_OVEN},
        {ItemIds::plantPlot, ENTITY_TYPES::PLOT},
        {ItemIds::resurrectionStone, ENTITY_TYPES::RESURRECTION},
        {ItemIds::emeraldMachine, ENTITY_TYPES::EMERALD_MACHINE},

        // Misc structures
        {ItemIds::bridge, ENTITY_TYPES::BRIDGE},
        {ItemIds::roof, ENTITY_TYPES::ROOF},
        {ItemIds::bed, ENTITY_TYPES::BED},
        {ItemIds::tower, ENTITY_TYPES::WOOD_TOWER}, // verify: only one tower type in ENTITY_TYPES

        // Walls
        {ItemIds::woodenWall, ENTITY_TYPES::WALL},
        {ItemIds::stoneWall, ENTITY_TYPES::STONE_WALL},
        {ItemIds::goldWall, ENTITY_TYPES::GOLD_WALL},
        {ItemIds::diamondWall, ENTITY_TYPES::DIAMOND_WALL},
        {ItemIds::amethystWall, ENTITY_TYPES::AMETHYST_WALL},
        {ItemIds::reiditeWall, ENTITY_TYPES::REIDITE_WALL},

        // Doors
        {ItemIds::woodenDoor, ENTITY_TYPES::WOOD_DOOR},
        {ItemIds::stoneDoor, ENTITY_TYPES::STONE_DOOR},
        {ItemIds::goldDoor, ENTITY_TYPES::GOLD_DOOR},
        {ItemIds::diamondDoor, ENTITY_TYPES::DIAMOND_DOOR},
        {ItemIds::amethystDoor, ENTITY_TYPES::AMETHYST_DOOR},
        {ItemIds::reiditeDoor, ENTITY_TYPES::REIDITE_DOOR},

        // Spikes
        // VERIFY: woodenSpike maps to SPIKE or WOOD_DOOR_SPIKE?
        // Assuming plain SPIKE = wooden, door spikes are separate entities not placeable via item
        {ItemIds::woodenSpike, ENTITY_TYPES::SPIKE},
        {ItemIds::stoneSpike, ENTITY_TYPES::STONE_SPIKE},
        {ItemIds::goldSpike, ENTITY_TYPES::GOLD_SPIKE},
        {ItemIds::diamondSpike, ENTITY_TYPES::DIAMOND_SPIKE},
        {ItemIds::amethystSpike, ENTITY_TYPES::AMETHYST_SPIKE},
        {ItemIds::reiditeSpike, ENTITY_TYPES::REIDITE_SPIKE},

        // Seeds — each seed item places a seed entity
        // VERIFY: berrySeeds → generic SEED, or does it share SEED with others?
        {ItemIds::berrySeeds, ENTITY_TYPES::SEED},
        {ItemIds::wheatSeeds, ENTITY_TYPES::WHEAT_SEED},
        {ItemIds::pumpkinSeeds, ENTITY_TYPES::PUMPKIN_SEED},
        {ItemIds::carrotSeeds, ENTITY_TYPES::CARROT_SEED},
        {ItemIds::tomatoSeeds, ENTITY_TYPES::TOMATO_SEED},
        {ItemIds::garlicSeeds, ENTITY_TYPES::GARLIC_SEED},
        {ItemIds::watermelonSeeds, ENTITY_TYPES::WATERMELON_SEED},
        {ItemIds::aloeVeraSeeds, ENTITY_TYPES::ALOE_VERA_SEED},
        {ENTITY_TYPES::WOLF, ENTITY_TYPES::WOLF},
        {ENTITY_TYPES::SPIDER, ENTITY_TYPES::SPIDER},
        {ENTITY_TYPES::RABBIT, ENTITY_TYPES::RABBIT},
    };

    auto it = types_map.find(id);
    if (it != types_map.end())
        return it->second;

    return -1;
}

int assign_raduis(int id)
{
    int def = 50;
    static const std::map<int, int> types_map = {
        // Fires
        {ItemIds::campfire, 0},
        {ItemIds::bigFire, 0},

        // Crafting / utility
        {ItemIds::workbench, def - 20},
        {ItemIds::furnace, def + 20},
        {ItemIds::chest, def - 30},
        {ItemIds::well, def},
        {ItemIds::windmill, def - 10},
        {ItemIds::breadOven, def - 10},
        {ItemIds::plantPlot, 0},
        {ItemIds::resurrectionStone, def},
        {ItemIds::emeraldMachine, def},

        // Misc structures
        {ItemIds::bridge, 0},
        {ItemIds::roof, 0},
        {ItemIds::bed, 0},
        {ItemIds::tower, 0}, // verify: only one tower type in ENTITY_TYPES

        // Walls
        {ItemIds::woodenWall, def},
        {ItemIds::stoneWall, def},
        {ItemIds::goldWall, def},
        {ItemIds::diamondWall, def},
        {ItemIds::amethystWall, def},
        {ItemIds::reiditeWall, def},

        // Doors
        {ItemIds::woodenDoor, def},
        {ItemIds::stoneDoor, def},
        {ItemIds::goldDoor, def},
        {ItemIds::diamondDoor, def},
        {ItemIds::amethystDoor, def},
        {ItemIds::reiditeDoor, def},

        // Spikes
        // VERIFY: woodenSpike maps to SPIKE or WOOD_DOOR_SPIKE?
        // Assuming plain SPIKE = wooden, door spikes are separate entities not placeable via item
        {ItemIds::woodenSpike, def - 10},
        {ItemIds::stoneSpike, def - 10},
        {ItemIds::goldSpike, def - 10},
        {ItemIds::diamondSpike, def - 10},
        {ItemIds::amethystSpike, def - 10},
        {ItemIds::reiditeSpike, def - 10},

        // Seeds — each seed item places a seed entity
        {ItemIds::berrySeeds, 20},
        {ItemIds::wheatSeeds, 20},
        {ItemIds::pumpkinSeeds, 20},
        {ItemIds::carrotSeeds, 20},
        {ItemIds::tomatoSeeds, 20},
        {ItemIds::garlicSeeds, 20},
        {ItemIds::watermelonSeeds, 20},
        {ItemIds::aloeVeraSeeds, 20},
    };

    auto it = types_map.find(id);
    if (it != types_map.end())
        return it->second;

    return def;
}

struct building_state
{
    int on = 1;
    int off = 0;
};
struct mob_state
{
    int idle = 0;
    int damage = 1;
    int move = 2;
};
struct player_state
{
    int idle = 0;
    int damage = 1;
    int hunger = 2;
    int cold = 3;
    int thirst = 4;
    int suffocation = 5;
    int move = 6;
};

struct states
{
    player_state player;
    mob_state mob;
    building_state building;
};

states STATES;

struct entity_data
{
    int id;
    int type;
    float x;
    float y;
    float angle;
    int hp;
    int state;
};
struct plant_data
{
    int id;
    int type;
    int amount;
    float x;
    float y;
    float angle;
    bool grown;
    bool watered;
};

struct player_data
{
    int id;
    int type;
    float x;
    float y;
    float angle;
    std::string name;
    int right;
    int helmet;
    int attack;
};
struct resource_data
{
    int id, type, x, y, s;
    float angle;
};

using unit_data = std::variant<player_data, entity_data, plant_data>;
