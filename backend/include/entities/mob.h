#pragma once
#include <chrono>
#include "./entity.h"
#include "../types.h"
class Mob : public Entity
{
private:
public:
    int target_player_id = -1;
    float next_x = 0, next_y = 0;

    bool collided = false;

    system_clock::time_point last_direction_update;

    Mob(int type) : Entity(type)
    {
        this->hp = 5;
    };
};
