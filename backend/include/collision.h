// collision.h
#pragma once
#include <cmath>
#include <algorithm>
#include "./entities/entity.h"
#include "./entities/player.h"
#include "./entities/build.h"
#include "./entities/mob.h"

// ─── Entity radii ─────────────────────────────────────────────────────────────
static constexpr float PLAYER_RADIUS = 24.0f;
static constexpr float MOB_RADIUS = 24.0f;

// Building half-sizes by type — add more as needed
static float get_build_half_size(int type)
{
    switch (type)
    {
    case ENTITY_TYPES::WALL:
    case ENTITY_TYPES::STONE_WALL:
    case ENTITY_TYPES::GOLD_WALL:
    case ENTITY_TYPES::DIAMOND_WALL:
    case ENTITY_TYPES::AMETHYST_WALL:
    case ENTITY_TYPES::REIDITE_WALL:
        return 40.0f;

    case ENTITY_TYPES::SPIKE:
    case ENTITY_TYPES::STONE_SPIKE:
    case ENTITY_TYPES::GOLD_SPIKE:
    case ENTITY_TYPES::DIAMOND_SPIKE:
    case ENTITY_TYPES::AMETHYST_SPIKE:
    case ENTITY_TYPES::REIDITE_SPIKE:
        return 32.0f;

    case ENTITY_TYPES::WOOD_DOOR:
    case ENTITY_TYPES::STONE_DOOR:
    case ENTITY_TYPES::GOLD_DOOR:
    case ENTITY_TYPES::DIAMOND_DOOR:
    case ENTITY_TYPES::AMETHYST_DOOR:
    case ENTITY_TYPES::REIDITE_DOOR:
        return 40.0f;

    case ENTITY_TYPES::CHEST:
    case ENTITY_TYPES::FURNACE:
    case ENTITY_TYPES::WORKBENCH:
    case ENTITY_TYPES::WELL:
    case ENTITY_TYPES::BREAD_OVEN:
        return 36.0f;

    default:
        return 30.0f;
    }
}

// ─── Circle vs Circle ─────────────────────────────────────────────────────────
// Returns true if overlap and writes push vector into (pushX, pushY)
static bool circle_vs_circle(
    float ax, float ay, float ar,
    float bx, float by, float br,
    float &pushX, float &pushY)
{
    float dx = ax - bx;
    float dy = ay - by;
    float dist = std::sqrt(dx * dx + dy * dy);
    float minD = ar + br;

    if (dist >= minD || dist == 0.0f)
        return false;

    float overlap = minD - dist;
    pushX = (dx / dist) * overlap;
    pushY = (dy / dist) * overlap;
    return true;
}

// ─── Circle vs AABB (axis-aligned bounding box) ───────────────────────────────
// Finds the closest point on the box to the circle, resolves overlap with sliding
static bool circle_vs_aabb(
    float cx, float cy, float radius,
    float bx, float by, float half, // box center + half-size (square)
    float &pushX, float &pushY)
{
    // clamp circle center to box bounds → closest point on box
    float nearestX = std::clamp(cx, bx - half, bx + half);
    float nearestY = std::clamp(cy, by - half, by + half);

    float dx = cx - nearestX;
    float dy = cy - nearestY;
    float dist = std::sqrt(dx * dx + dy * dy);

    if (dist >= radius || dist == 0.0f)
        return false;

    float overlap = radius - dist;
    pushX = (dx / dist) * overlap;
    pushY = (dy / dist) * overlap;
    return true;
}

static bool check_collision(
    float ax, float ay, float ar,
    float bx, float by, float br)
{
    float dx = ax - bx;
    float dy = ay - by;
    float dist = std::sqrt(dx * dx + dy * dy);
    float minD = ar + br;

    if (dist >= minD || dist == 0)
        return false;
    return true;
}