#pragma once
#include <string>
#include "../types.h"

class Entity
{
private:
public:
    int hp = 200,
        type,
        speed = 5,
        speed_multiplier = 1,
        id,
        raduis = 20,
        state = 0,
        gridCx = -1,
        gridCy = -1;

    float angle,
        x,
        y,
        old_x,
        old_y;

    bool changed = true,
         alive = true,
         plant = false,
         damaged = false;

    Entity(int id)
    {
        if (id == ENTITY_TYPES::PLAYERS)
        {
            this->type = ENTITY_TYPES::PLAYERS;
            this->raduis = 25;
        }
        else
        {
            this->type = assign_type(id);
            this->raduis = assign_raduis(id);
        }
    };

    bool take_damage(int amount)
    {
        this->hp -= amount;
        return this->hp <= 0;
    }

    void move(int x, int y)
    {
        this->x = x;
        this->y = y;
    }
    void dead()
    {
        this->alive = false;
    }
};
