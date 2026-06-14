#pragma once
#include <chrono>
#include "./entity.h"
#include "../types.h"

class Box : public Entity
{
private:
public:
    int raduis = 20;

    std::unordered_map<int, int> items = {};

    std::chrono::system_clock::time_point spawn_time = std::chrono::system_clock::now();

    Box(int type, bool dead) : Entity(type)
    {
        if (!dead)
            this->hp = 30;
        else
            // this->hp = 240;
            this->hp = 10;

        this->type = ENTITY_TYPES::BOX;
    };
};
