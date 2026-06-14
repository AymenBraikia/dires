#pragma once
#include <chrono>
#include "./entity.h"
#include "../types.h"

using namespace std::chrono;

class Plant : public Entity
{
private:
public:
    int fertilizer = 0,
        amount = 0,
        cooldown = 0,
        max_amount = 0,
        fruit = 0;

        bool watered = true,
        grown = false;

    system_clock::time_point last_watered = system_clock::now();
    system_clock::time_point last_fertilized = system_clock::now();
    system_clock::time_point last_regen = system_clock::now();

    Plant(int id) : Entity(id)
    {
        this->set_plant_settings(id);
        this->plant = true;
    };
    void set_plant_settings(int id)
    {

        switch (id)
        {

        case ItemIds::berrySeeds:
            this->cooldown = 20'000;
            this->fruit = ItemIds::berries;
            this->max_amount = 3;
            break;

        case ItemIds::wheatSeeds:
            this->cooldown = 10'000;
            this->fruit = ItemIds::wheat;
            this->max_amount = 1;
            break;

        case ItemIds::pumpkinSeeds:
            this->cooldown = 60'000;
            this->fruit = ItemIds::pumpkin;
            this->max_amount = 1;
            break;

        case ItemIds::carrotSeeds:
            this->cooldown = 40'000;
            this->fruit = ItemIds::carrot;
            this->max_amount = 1;
            break;

        case ItemIds::tomatoSeeds:
            this->cooldown = 30'000;
            this->fruit = ItemIds::tomato;
            this->max_amount = 3;
            break;

        case ItemIds::garlicSeeds:
            this->cooldown = 60'000;
            this->fruit = ItemIds::garlic;
            this->max_amount = 1;
            break;

        case ItemIds::watermelonSeeds:
            this->cooldown = 80'000;
            this->fruit = ItemIds::watermelon;
            this->max_amount = 1;
            break;

        case ItemIds::aloeVeraSeeds:
            this->cooldown = 40'000;
            this->fruit = ItemIds::aloeVera;
            this->max_amount = 1;
            break;

        default:
            break;
        }
    }
};
