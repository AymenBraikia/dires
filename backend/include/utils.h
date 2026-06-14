#pragma once
#include <random>
#include <cmath>

int random_int(int min, int max)
{
    static std::mt19937 rng{std::random_device{}()};
    std::uniform_int_distribution<int> dist(min, max);
    return dist(rng);
}

float random_float(float min, float max)
{
    static std::mt19937 rng{std::random_device{}()};
    std::uniform_real_distribution<float> dist(min, max);
    return dist(rng);
}

float calc_dist(float x1, float y1, float x2, float y2, int rad1, int rad2)
{
    float dx = x1 - x2;
    float dy = y1 - y2;
    float dist = std::sqrt(dx * dx + dy * dy);
    return dist - (rad1 + rad2);
}

float calc_dist(float x1, float x2, float y1, float y2)
{
    float dx = x1 - x2;
    float dy = y1 - y2;
    return std::sqrt(dx * dx + dy * dy);
}