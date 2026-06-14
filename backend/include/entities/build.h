#pragma once
#include "./entity.h"
#include "./player.h"
#include "../types.h"
#include <chrono>
#include <set>

struct build_info
{
    bool require_both = false;
    bool active = false;
    bool updated = false;
    int input1_type = -1,
        input2_type = -1,
        amount_type = -1,

        input1 = 0,
        input2 = 0,
        amount = 0,

        max = -1,
        inc = 1,
        dec = 1;
    std::unordered_set<int> players = {};

    int cd = 5000;
    std::chrono::system_clock::time_point last_update = std::chrono::system_clock::now();
};

class Build : public Entity
{
private:
public:
    int range = 150,
        dmg = 0;
    bool updatable = false;

    Player* owner;

    build_info info;

    Build(int item_id) : Entity(item_id)
    {
        this->hp = 2000;
        switch (item_id)
        {
        case ItemIds::woodenSpike:
            dmg = 10;
            range = 50;
            break;
        case ItemIds::stoneSpike:
            dmg = 20;
            range = 50;
            break;
        case ItemIds::goldSpike:
            dmg = 30;
            range = 50;
            break;
        case ItemIds::diamondSpike:
            dmg = 40;
            range = 50;
            break;
        case ItemIds::amethystSpike:
            dmg = 50;
            range = 50;
            break;
        case ItemIds::reiditeSpike:
            dmg = 60;
            range = 50;
            break;

        case ItemIds::breadOven:
            info.require_both = true;
            info.max = 31;
            info.input1_type = ItemIds::wood;
            info.input2_type = ItemIds::flour;
            info.amount_type = ItemIds::bread;
            updatable = true;

            break;

        case ItemIds::furnace:
            info.input1_type = ItemIds::wood;
            info.max = -1;
            updatable = true;
            break;
        case ItemIds::chest:
            info.max = -1;
            updatable = true;
            break;
        case ItemIds::windmill:
            info.input1_type = ItemIds::wheat;
            info.amount_type = ItemIds::flour;
            info.max = 255;
            updatable = true;
            break;
        default:
            break;
        }
    };
};