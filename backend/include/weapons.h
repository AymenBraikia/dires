#pragma once
#include "ids.h"
#include <vector>

struct weapon_data
{
    int dmg = 5;
    int range = 30;
    int area_angle = 0.1f; // 30 deg
};

std::vector<int> swords = {
    ItemIds::stoneSword,
    ItemIds::stoneSword,
    ItemIds::stoneSword,
    ItemIds::goldSword,
    ItemIds::diamondSword,
    ItemIds::amethystSword,
    ItemIds::reiditeSword,
    ItemIds::demonicSword,
    ItemIds::satanSword,
};

std::vector<int> spears = {
    ItemIds::stoneSpear,
    ItemIds::stoneSpear,
    ItemIds::stoneSpear,
    ItemIds::goldSpear,
    ItemIds::diamondSpear,
    ItemIds::amethystSpear,
    ItemIds::reiditeSpear,
    ItemIds::demonicSpear,
    ItemIds::satanSpear,
};

std::vector<int> axes = {
    ItemIds::stoneAxe,
    ItemIds::stoneAxe,
    ItemIds::stoneAxe,
    ItemIds::goldAxe,
    ItemIds::diamondAxe,
    ItemIds::amethystAxe,
    ItemIds::reiditeAxe,
    ItemIds::demonicAxe,
    ItemIds::satanAxe,
};

auto get_weapon_data(int id)
{

    weapon_data wpn;
    if (std::find(spears.begin(), spears.end(), id) != spears.end())
    {
        switch (id)
        {
        case ItemIds::stoneSpear:
            wpn.dmg = 12 + 0;
            break;
        case ItemIds::goldSpear:
            wpn.dmg = 12 + 3;
            break;
        case ItemIds::diamondSpear:
            wpn.dmg = 12 + 5;
            break;
        case ItemIds::amethystSpear:
            wpn.dmg = 12 + 8;
            break;
        case ItemIds::reiditeSpear:
            wpn.dmg = 12 + 10;
            break;
        case ItemIds::demonicSpear:
            wpn.dmg = 12 + 13;
            break;
        case ItemIds::satanSpear:
            wpn.dmg = 12 + 15;
            break;
        }
        wpn.range = 190;
    }
    else if (std::find(swords.begin(), swords.end(), id) != swords.end())
    {
        switch (id)
        {
        case ItemIds::stoneSword:
            wpn.dmg = 16 + 0;
            break;
        case ItemIds::goldSword:
            wpn.dmg = 16 + 3;
            break;
        case ItemIds::diamondSword:
            wpn.dmg = 16 + 5;
            break;
        case ItemIds::amethystSword:
            wpn.dmg = 16 + 8;
            break;
        case ItemIds::reiditeSword:
            wpn.dmg = 16 + 11;
            break;
        case ItemIds::demonicSword:
            wpn.dmg = 16 + 14;
            break;
        case ItemIds::satanSword:
            wpn.dmg = 16 + 18;
            break;
        }
        wpn.area_angle = 0.25f; // 60 deg
        wpn.range = 120;
    }
    else if (std::find(axes.begin(), axes.end(), id) != axes.end())
    {
        switch (id)
        {
        case ItemIds::stoneAxe:
            wpn.dmg = 20 + 0;
            break;
        case ItemIds::goldAxe:
            wpn.dmg = 20 + 3;
            break;
        case ItemIds::diamondAxe:
            wpn.dmg = 20 + 6;
            break;
        case ItemIds::amethystAxe:
            wpn.dmg = 20 + 9;
            break;
        case ItemIds::reiditeAxe:
            wpn.dmg = 20 + 12;
            break;
        case ItemIds::demonicAxe:
            wpn.dmg = 20 + 16;
            break;
        case ItemIds::satanAxe:
            wpn.dmg = 20 + 20;
            break;
        }
        wpn.area_angle = 0.35f; // 90 deg
        wpn.range = 100;
    }
    else if (std::find(pickaxes.begin(), pickaxes.end(), id) != pickaxes.end())
    {
        switch (id)
        {
        case 0:
            wpn.dmg = 1;
            wpn.range = 30;
            return wpn;
        case ItemIds::woodenPickaxe:
            wpn.dmg = 2;
            break;
        case ItemIds::stonePickaxe:
            wpn.dmg = 3;
            break;
        case ItemIds::goldPickaxe:
            wpn.dmg = 4;
            break;
        case ItemIds::diamondPickaxe:
            wpn.dmg = 5;
            break;
        case ItemIds::amethystPickaxe:
            wpn.dmg = 6;
            break;
        case ItemIds::reiditePickaxe:
            wpn.dmg = 7;
            break;
        }
        wpn.range = 80;
    }
    else if (ItemIds::pitchfork == id || ItemIds::goldPitchfork == id)
    {
        wpn.dmg = 0;
        wpn.range = 210;
    }

    return wpn;
}