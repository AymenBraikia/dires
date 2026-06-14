#pragma once
#include <chrono>
#include "../types.h"
#include "../ids.h"

class Resource
{
private:
public:
    std::chrono::system_clock::time_point last_regen;

    int type,
        size = 0,
        raduis = 50,
        gridCx = -1,
        gridCy = -1,
        amount = 50,
        max_amount = 30,
        hardness = 0,
        x,
        y,
        ore_id,
        id;

    float angle;

    bool changed = true;

    Resource(std::string type, int size)
    {
        this->size = size;
        this->raduis = assign_resource_radius(size);
        this->type = assign_resource_type(type);
        switch (this->type)
        {
        case 0:
            this->ore_id = ItemIds::wood;
            this->hardness = 0;
            break;
        case 1:
            this->ore_id = ItemIds::stone;
            this->hardness = 1;
            break;
        case 2:
            this->ore_id = ItemIds::gold;
            this->hardness = 2;
            break;
        case 3:
            this->ore_id = ItemIds::diamond;
            this->hardness = 3;
            break;
        case 4:
            this->ore_id = ItemIds::amethyst;
            this->hardness = 4;
            break;
        case 5:
            this->ore_id = ItemIds::reidite;
            this->hardness = 5;
            break;
        case 6:
            this->ore_id = ItemIds::emerald;
            this->hardness = 6;
            break;
        case 7:
            this->ore_id = ItemIds::berries;
            this->hardness = 0;
            break;
        case 8:
            this->ore_id = ItemIds::cactus;
            this->hardness = 0;
            break;

        default:
            break;
        }

        switch (this->size)
        {
        case 1:
            max_amount = 30;
            break;
        case 2:
            max_amount = 40;
            break;
        case 3:
            max_amount = 50;
            break;
        default:
            max_amount = 30;
            break;
        }
    };
};
