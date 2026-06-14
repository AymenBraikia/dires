#pragma once
#include <sstream>
#include <iostream>
#include <string>
#include <vector>
#include <asio.hpp>
#include <thread>
#include <unordered_set>
#include <unordered_map>
#include <random>
#include <stdexcept>
#include <chrono>
#include <algorithm>
#include <mutex>
#include <fstream>
#include <limits>

#include "nlohmann/json.hpp"

#include "./recipe.h"
#include "./packets.h"
#include "./collision.h"
#include "./weapons.h"
#include "./utils.h"
#include "./types.h"
#include "./entities/entity.h"
#include "./entities/player.h"
#include "./entities/plant.h"
#include "./entities/mob.h"
#include "./entities/build.h"
#include "./entities/box.h"
#include "./entities/resource.h"

using namespace std;
using asio::ip::tcp;
using Clock = std::chrono::steady_clock;
using Ms = std::chrono::milliseconds;
using json = nlohmann::json;

// ─── ID generator statics ────────────────────────────────────────────────────
static std::unordered_set<int> _used_ids;
static std::mt19937 _rng{std::random_device{}()};
static std::uniform_int_distribution<int> _dist{0, 10000};
int total_updates = 0;

struct mobs_count
{
    int wolf = 0;
    int spider = 0;
    int rabbit = 0;
};
struct each_mobs_count
{
    int wolf = 0;
    int spider = 0;
    int rabbit = 0;
};

// ─── Server ───────────────────────────────────────────────────────────────────
class Server
{
public:
    vector<std::unique_ptr<Entity>> entities;
    vector<std::unique_ptr<Build>> buildings;
    vector<std::unique_ptr<Player>> players;
    vector<std::unique_ptr<Plant>> plants;
    vector<std::unique_ptr<Mob>> mobs;
    vector<std::unique_ptr<Box>> boxes;
    vector<std::unique_ptr<Resource>> resources;

    vector<std::unique_ptr<Box>> pending_boxes;

    std::vector<std::unique_ptr<Player>> dead_players;
    std::vector<std::unique_ptr<Mob>> dead_mobs;
    std::vector<std::unique_ptr<Build>> dead_buildings;
    std::vector<std::unique_ptr<Box>> dead_boxes;

    std::mutex mtx;

    int width = 10e3;
    int height = 10e3;
    int tps_target = 60;
    float tps = 0;

    mobs_count mob_count;
    each_mobs_count each_mob_count;

    system_clock::time_point last_tps_reset = system_clock::now();
    system_clock::time_point now = system_clock::now();

    const int CELL_SIZE = 500;
    std::unordered_map<uint64_t, std::vector<Entity *>> grid;

    tcp::acceptor *ws;

    std::vector<int> pending_kills;

    Server(tcp::acceptor *ws, int server_tps) : ws(ws)
    {
        this->tps_target = std::round(1000 / server_tps);

        std::ifstream file("../../settings/world.json");
        if (!file.is_open())
            std::cerr << "Failed to open world.json\n";
        else
        {
            json data = json::parse(file);

            for (auto &[resource_type, arr] : data.items())
                for (auto &res_data : arr)
                {
                    auto resource = std::make_unique<Resource>(res_data["type"], res_data["size"]);
                    resource->id = generate_id();
                    resource->x = res_data["x"];
                    resource->y = res_data["y"];
                    resource->size = res_data["size"];
                    resource->angle = res_data["angle"];

                    insertEntity(resource.get());
                    resources.push_back(std::move(resource));
                }
        };

        std::ifstream recipeJSON("../../settings/recipe.json");
        if (!recipeJSON.is_open())
            std::cerr << "Failed to open recipe.json\n";
        else
        {
            json data = json::parse(recipeJSON);
            init_recipes(data);
        }

        cout << "server started and target tps is: " << server_tps << "\n";
        buildGrid();
    }

    // ── Spatial grid ──────────────────────────────────────────────────────────
    uint64_t cellKey(int cx, int cy)
    {
        return ((uint64_t)(uint32_t)cx << 32) | (uint32_t)cy;
    }

    void insertEntity(Entity *e)
    {
        int cx = (int)(e->x / CELL_SIZE);
        int cy = (int)(e->y / CELL_SIZE);
        e->gridCx = cx;
        e->gridCy = cy;
        grid[cellKey(cx, cy)].push_back(e);
    }
    void insertEntity(Resource *e)
    {
        int cx = (int)(e->x / CELL_SIZE);
        int cy = (int)(e->y / CELL_SIZE);
        e->gridCx = cx;
        e->gridCy = cy;
        grid[cellKey(cx, cy)].push_back(reinterpret_cast<Entity *>(e));
    }

    void removeFromGrid(Entity *e)
    {
        int cx = (int)(e->x / CELL_SIZE);
        int cy = (int)(e->y / CELL_SIZE);
        auto &cell = grid[cellKey(cx, cy)];
        cell.erase(std::remove(cell.begin(), cell.end(), e), cell.end());
    }
    void updateEntityInGrid(Entity *e, float oldX, float oldY)
    {
        int newCx = (int)(e->x / CELL_SIZE);
        int newCy = (int)(e->y / CELL_SIZE);

        if (e->gridCx == newCx && e->gridCy == newCy)
            return; // same cell, nothing to do

        // remove from old cell using stored cell coords (no recomputation)
        auto &oldCell = grid[cellKey(e->gridCx, e->gridCy)];
        oldCell.erase(std::remove(oldCell.begin(), oldCell.end(), e), oldCell.end());

        // insert into new cell
        grid[cellKey(newCx, newCy)].push_back(e);
        e->gridCx = newCx;
        e->gridCy = newCy;
    }
    void buildGrid()
    {
        grid.clear();
        for (auto &e : entities)
            insertEntity(e.get());
        for (auto &p : players)
            insertEntity(p.get());
        for (auto &m : mobs)
            insertEntity(m.get());
        for (auto &b : buildings)
            insertEntity(b.get());
        for (auto &b : boxes)
            insertEntity(b.get());
        for (auto &p : plants)
            insertEntity(p.get());
    }

    std::vector<Entity *> get_visible(float x, float y, float screenW, float screenH)
    {
        std::vector<Entity *> result;

        int x0 = (int)((x - screenW / 2) / CELL_SIZE);
        int x1 = (int)((x + screenW / 2) / CELL_SIZE);
        int y0 = (int)((y - screenH / 2) / CELL_SIZE);
        int y1 = (int)((y + screenH / 2) / CELL_SIZE);

        for (int cx = x0; cx <= x1; cx++)
            for (int cy = y0; cy <= y1; cy++)
                for (Entity *e : grid[cellKey(cx, cy)])
                {
                    if (e->alive)
                        result.push_back(e);
                }

        return result;
    }

    // ── Broadcast helpers ─────────────────────────────────────────────────────
    void send(Player *player, Packet pkt)
    {
        if (player->connected && player->alive)
            pkt.send(player->socket);
    }

    void broadcast(Packet pkt)
    {
        for (auto &player : players)
        {
            if (player->connected && player->alive)
                pkt.send(player->socket);
        }
    }

    // ── Game loop ─────────────────────────────────────────────────────────────
    void loop()
    {
        while (true)
        {
            auto tick_start = steady_clock::now();
            {
                std::lock_guard<std::mutex> lock(mtx);

                update_players();
                update_mobs();
                update_world();
                update_buildings();
                resolve_collisions();

                update_grid();
                broadcast_units();
                cleanup();
            }

            auto elapsed = duration_cast<milliseconds>(steady_clock::now() - tick_start);

            auto sleep_for = milliseconds(tps_target) - elapsed;

            if (sleep_for.count() > 0)
                std::this_thread::sleep_for(sleep_for);

            now = system_clock::now();

            if (duration_cast<milliseconds>(now - last_tps_reset).count() >= 1000)
            {
                Packet tps_pkt(PKT_TPS);
                tps_pkt.write(tps);

                broadcast(tps_pkt);

                last_tps_reset = now;
                tps = 0;
            }
            else
                tps++;
        }
    }
    void cleanup()
    {
        for (int id : pending_kills)
        {
            auto p = std::find_if(players.begin(), players.end(),
                                  [id](const std::unique_ptr<Player> &p)
                                  { return p->id == id; });

            if (p != players.end())
            {
                dead_players.push_back(std::move(*p));
                players.erase(p);

                release_id(id);
                continue;
            }
            else
            {
                auto m = std::find_if(mobs.begin(), mobs.end(),
                                      [id](const std::unique_ptr<Mob> &p)
                                      { return p->id == id; });

                if (m != mobs.end())
                {
                    dead_mobs.push_back(std::move(*m));
                    mobs.erase(m);

                    release_id(id);
                    continue;
                }
                else
                {
                    auto b = std::find_if(boxes.begin(), boxes.end(),
                                          [id](const std::unique_ptr<Box> &p)
                                          { return p->id == id; });
                    if (b != boxes.end())
                    {
                        dead_boxes.push_back(std::move(*b));
                        boxes.erase(b);

                        release_id(id);
                        continue;
                    }
                    else
                    {
                        auto b = std::find_if(buildings.begin(), buildings.end(),
                                              [id](const std::unique_ptr<Build> &p)
                                              { return p->id == id; });

                        if (b != buildings.end())
                        {
                            dead_buildings.push_back(std::move(*b));
                            buildings.erase(b);

                            release_id(id);
                            continue;
                        }
                    }
                }
            }
        }

        if (pending_kills.size() > 0)
            pending_kills.clear();

        // Safely clean up dead_players once their thread is done
        dead_players.erase(
            std::remove_if(dead_players.begin(), dead_players.end(),
                           [](const std::unique_ptr<Player> &p)
                           {
                               return p->thread_done ? true : false;
                           }),
            dead_players.end());

        // handle pending_boxes
        for (auto &b : pending_boxes)
        {
            insertEntity(b.get());
            boxes.push_back(std::move(b));
        }
        if (pending_boxes.size() > 0)
            pending_boxes.clear();
    }

    void update_players()
    {
        for (auto &p : players)
        {
            if (!p->alive)
            {
                //     bool found = false;
                //     for(Player d : dead_player)
                //         if(d->id == p->id ) {
                //             found = true;
                //             break;
                //         }
                //     if (!found)
                //         dead_players.push_back(std::move(p));
                continue;
            }

            if (duration_cast<milliseconds>(now - p->time_stamps.last_gauges_update).count() >= 5e3)
                p->tick();

            if (p->direction)
            {

                p->old_x = p->x;
                p->old_y = p->y;

                bool is_heavy = std::find(weapons.begin(), weapons.end(), p->right) != weapons.end();

                float multiplier = is_heavy ? p->speed_multiplier - 0.3f : p->speed_multiplier;
                if (p->collided)
                    multiplier -= 0.3;

                switch (p->direction)
                {
                case 0:
                    break;

                case 1: // left
                    p->x -= p->speed * multiplier;
                    p->x = std::max((float)0, p->x);
                    break;
                case 2: // right
                    p->x += p->speed * multiplier;
                    p->x = std::min((float)this->width, p->x);
                    break;
                case 4: // bottom
                    p->y += p->speed * multiplier;
                    p->y = std::min((float)this->height, p->y);
                    break;
                case 5: // bottom left

                    p->x -= p->speed * multiplier * 0.8;
                    p->x = std::max((float)0, p->x);

                    p->y += p->speed * multiplier * 0.8;
                    p->y = std::min((float)this->height, p->y);
                    break;
                case 6: // bottom right
                    p->x += p->speed * multiplier * 0.8;
                    p->x = std::min((float)this->width, p->x);

                    p->y += p->speed * multiplier * 0.8;
                    p->y = std::min((float)this->height, p->y);
                    break;

                case 8: // top
                    p->y -= p->speed * multiplier;
                    p->y = std::max((float)0, p->y);
                    break;

                case 9: // top left
                    p->y -= p->speed * multiplier * 0.8;
                    p->y = std::max((float)0, p->y);

                    p->x -= p->speed * multiplier * 0.8;
                    p->x = std::max((float)0, p->x);
                    break;

                case 10: // top right
                    p->y -= p->speed * multiplier * 0.8;
                    p->y = std::max((float)0, p->y);

                    p->x += p->speed * multiplier * 0.8;
                    p->x = std::max((float)0, p->x);
                    break;

                default:
                    p->direction = 0;
                    break;
                }
                p->x = std::round(p->x * 100.0f) / 100.0f;
                p->y = std::round(p->y * 100.0f) / 100.0f;

                p->changed = true;
            }

            if (p->attack && p->can_attack && duration_cast<milliseconds>(now - p->time_stamps.last_attack).count() >= 700)
            {

                p->time_stamps.last_attack = now;

                weapon_data weapon = get_weapon_data(p->right);

                // direction from server-owned angle
                float dirX = std::cos(p->angle);
                float dirY = std::sin(p->angle);

                // tip of the sword
                float hitX = p->x + dirX * weapon.range;
                float hitY = p->y + dirY * weapon.range;

                for (auto &plant : plants)
                {
                    if (plant->amount <= 0)
                        continue;
                    // cone check using dot product against attacker's angle
                    float dx = plant->x - p->x;
                    float dy = plant->y - p->y;
                    float len = std::sqrt(dx * dx + dy * dy);

                    if (len == 0)
                        continue;

                    float dot = (dx / len) * dirX + (dy / len) * dirY;

                    float effectiveRange = weapon.range + plant->raduis;

                    float angularSize = plant->raduis / len;
                    float adjustedAngle = std::max(weapon.area_angle - angularSize, weapon.area_angle / 2.0f);

                    if (len <= effectiveRange && dot >= adjustedAngle)
                    {
                        int dt = plant->amount;

                        plant->amount = std::max(plant->amount - 1, 0);

                        dt -= plant->amount;

                        if (dt > 0)
                        {
                            if (p->right == ItemIds::goldPitchfork)
                                p->add_to_inventory(plant->fruit, dt * 3);
                            if (p->right == ItemIds::pitchfork)
                                p->add_to_inventory(plant->fruit, dt * 2);
                            else
                                p->add_to_inventory(plant->fruit, dt);
                        }

                        plant->changed = true;
                    }
                }

                if (find(pickaxes.begin(), pickaxes.end(), p->right) != pickaxes.end())
                    for (auto &res : resources)
                    {
                        if (res->amount <= 0)
                            continue;
                        // cone check using dot product against attacker's angle
                        float dx = res->x - p->x;
                        float dy = res->y - p->y;
                        float len = std::sqrt(dx * dx + dy * dy);

                        if (len == 0)
                            continue;

                        float dot = (dx / len) * dirX + (dy / len) * dirY;

                        float effectiveRange = weapon.range + res->raduis;

                        float angularSize = res->raduis / len;
                        float adjustedAngle = std::max(weapon.area_angle - angularSize, weapon.area_angle / 2.0f);

                        if (len <= effectiveRange && dot >= adjustedAngle)
                        {
                            if (weapon.dmg < res->hardness)
                            {
                                Packet tool_pkt(PKT_MESSAGE);
                                tool_pkt.write(string("you need a better pickaxe to farm this resource"));
                                p->send(tool_pkt);
                                continue;
                            }
                            int dt = res->amount;

                            res->amount = std::max(res->amount - (weapon.dmg - res->hardness), 0);

                            dt -= res->amount;

                            if (dt > 0)
                                p->add_to_inventory(res->ore_id, dt);

                            res->changed = true;

                            if (res->amount <= 0)
                            {
                                Packet empty_pkt(PKT_MESSAGE);

                                empty_pkt.write(string("the resource is empty wait for it to regenerate"));

                                p->send(empty_pkt);
                                continue;
                            };
                        }
                    }

                for (auto &m : mobs)
                {
                    if (!m->alive)
                        continue;

                    // cone check using dot product against attacker's angle
                    float dx = m->x - p->x;
                    float dy = m->y - p->y;
                    float len = std::sqrt(dx * dx + dy * dy);

                    if (len == 0)
                        continue;

                    float dot = (dx / len) * dirX + (dy / len) * dirY;

                    // expand effective range by m's radius so edge hits count
                    float effectiveRange = weapon.range + m->raduis;

                    // loosen cone threshold by the angular size of the m at that distance
                    // the further away, the smaller it appears — asin(r/len) gives the angle offset
                    float angularSize = m->raduis / len; // approx of sin(angle), good enough at game distances
                    float adjustedAngle = std::max(weapon.area_angle - angularSize, weapon.area_angle / 2.0f);

                    if (len <= effectiveRange && dot >= adjustedAngle)
                    {
                        m->hp -= weapon.dmg;
                        m->changed = true;
                        m->damaged = true;

                        if (m->hp <= 0)
                        {
                            kill_mob(m->id);
                            continue;
                        };
                    }
                }

                for (auto &target : boxes)
                {
                    if (!target->alive)
                        continue;

                    // cone check using dot product against attacker's angle
                    float dx = target->x - p->x;
                    float dy = target->y - p->y;
                    float len = std::sqrt(dx * dx + dy * dy);

                    if (len == 0)
                        continue;

                    float dot = (dx / len) * dirX + (dy / len) * dirY;

                    // expand effective range by target's radius so edge hits count
                    float effectiveRange = weapon.range + target->raduis;

                    // loosen cone threshold by the angular size of the target at that distance
                    // the further away, the smaller it appears — asin(r/len) gives the angle offset
                    float angularSize = target->raduis / len; // approx of sin(angle), good enough at game distances
                    float adjustedAngle = std::max(weapon.area_angle - angularSize, weapon.area_angle / 2.0f);

                    if (len <= effectiveRange && dot >= adjustedAngle)
                    {
                        target->hp -= weapon.dmg;
                        target->changed = true;
                        target->damaged = true;

                        if (target->hp <= 0)
                        {
                            kill_box(target->id, p->id);
                            continue;
                        };
                    }
                }

                for (auto &target : players)
                {
                    if (p->id == target->id || !target->alive)
                        continue;

                    // cone check using dot product against attacker's angle
                    float dx = target->x - p->x;
                    float dy = target->y - p->y;
                    float len = std::sqrt(dx * dx + dy * dy);

                    if (len == 0)
                        continue;

                    float dot = (dx / len) * dirX + (dy / len) * dirY;

                    // expand effective range by target's radius so edge hits count
                    float effectiveRange = weapon.range + target->raduis;

                    // loosen cone threshold by the angular size of the target at that distance
                    // the further away, the smaller it appears — asin(r/len) gives the angle offset
                    float angularSize = target->raduis / len; // approx of sin(angle), good enough at game distances
                    float adjustedAngle = std::max(weapon.area_angle - angularSize, weapon.area_angle / 2.0f);

                    if (len <= effectiveRange && dot >= adjustedAngle)
                    {
                        int delta = weapon.dmg + p->buff - target->protection;
                        target->hp -= delta;
                        target->changed = true;
                        target->damaged = true;

                        Packet target_pkt(PKT_PLAYER_GAUGES);

                        auto q = target->quests.find("green_gem");
                        if (q != target->quests.end())
                            if (!q->second.failled && !q->second.completed)
                            {
                                q->second.failled = true;
                            }
                        target->send_quests();

                        if (target->hp <= 0)
                        {
                            kill_player(target->id);
                            continue;
                        };
                        target_pkt.write(target->hp)
                            .write(target->gauges.hunger)
                            .write(target->gauges.temprature)
                            .write(target->gauges.thirst)
                            .write(target->gauges.oxygen);

                        target->send(target_pkt);
                    }
                }
            }

            float closest = 500;

            int open_build = -1;

            for (auto &b : buildings)
                if (b->updatable)
                {
                    float dist = calc_dist(b->x, p->x, b->y, p->y);
                    if (dist < closest && dist <= b->range + b->raduis)
                    {
                        closest = dist;
                        open_build = b->id;
                    }
                }

            if (p->open_build != open_build)
                p->set_open_build(open_build);

            for (auto d : p->pending_drops)
            {

                p->decrease_inventory(d);

                auto box = std::make_unique<Box>(ENTITY_TYPES::BOX, true);
                box->x = p->x;
                box->y = p->y;
                box->angle = p->angle;
                box->id = generate_id();
                box->items.insert({d.first, d.second});

                pending_boxes.push_back(std::move(box));
            }
            p->pending_drops.clear();

            for (auto req : p->pending_puts)
                for (auto &b : buildings)
                    if (b->updatable)

                        if (b->id == req.id && b->info.players.count(p->id) > 0)
                        {
                            if (req.item_id < 0 || !p->has_item_amount_in_inventory(req.item_id, req.amount))
                                break;

                            int delta = 0;

                            if (b->info.input1_type == req.item_id)
                            {
                                if (b->info.max >= 0 && b->info.max <= b->info.input1)
                                    break;
                                int available = b->info.max - b->info.input1;
                                delta = std::min(available, req.amount);
                                b->info.input1 += delta;
                            }

                            else if (b->info.input2_type == req.item_id)
                            {
                                if (b->info.max >= 0 && b->info.max <= b->info.input2)
                                    break;
                                int available = b->info.max - b->info.input2;
                                delta = std::min(available, req.amount);
                                b->info.input2 += delta;
                            }
                            else if (b->info.input1_type < 0 && (b->info.amount_type == req.item_id || b->info.amount_type < 0))
                            {
                                if (req.amount > 0)
                                {
                                    b->info.amount += req.amount;
                                    p->decrease_inventory(req.item_id, req.amount);
                                    b->info.updated = true;
                                    if (b->info.amount_type != req.item_id)
                                        b->info.amount_type = req.item_id;
                                }
                            }
                            else
                                break;

                            if (delta > 0)
                            {
                                p->decrease_inventory(req.item_id, delta);
                                b->info.updated = true;
                            };

                            break;
                        };
            p->pending_puts.clear();

            for (auto bid : p->pending_takes)
                for (auto &b : buildings)
                    if (b->updatable)
                        if (b->id == bid && b->info.players.count(p->id) > 0)
                        {
                            if (b->info.amount <= 0 || b->info.amount_type < 0)
                                break;

                            int delta = std::min(255, b->info.amount);

                            if (delta > 0)
                            {
                                p->add_to_inventory(b->info.amount_type, delta);
                                b->info.amount -= delta;
                                b->info.updated = true;

                                if (b->type == ENTITY_TYPES::CHEST && b->info.amount <= 0)
                                    b->info.amount_type = -1;
                            };

                            break;
                        };
            p->pending_takes.clear();
        }
    }

    void update_mobs()
    {
        for (size_t i = each_mob_count.wolf; i < mob_count.wolf; i++)
        {

            auto mob = std::make_unique<Mob>(ENTITY_TYPES::WOLF);
            mob->id = generate_id();

            mob->x = random_int(0, 4e3);
            mob->y = random_int(6e3, 10e3);

            insertEntity(mob.get());

            mobs.push_back(std::move(mob));
            each_mob_count.wolf++;
        }
        for (size_t i = each_mob_count.spider; i < mob_count.spider; i++)
        {

            auto mob = std::make_unique<Mob>(ENTITY_TYPES::SPIDER);
            mob->id = generate_id();

            mob->x = random_int(0, 4e3);
            mob->y = random_int(6e3, 10e3);

            insertEntity(mob.get());

            mobs.push_back(std::move(mob));
            each_mob_count.spider++;
        }
        for (size_t i = each_mob_count.rabbit; i < mob_count.rabbit; i++)
        {

            auto mob = std::make_unique<Mob>(ENTITY_TYPES::RABBIT);
            mob->id = generate_id();

            mob->x = random_int(0, 4e3);
            mob->y = random_int(6e3, 10e3);

            insertEntity(mob.get());

            mobs.push_back(std::move(mob));
            each_mob_count.rabbit++;
        }
        for (auto &mob : mobs)
        {
            if (!mob->alive)
                continue;
            bool has_target = mob->target_player_id >= 0;
            int cd = has_target ? 1000 : 1500;

            mob->changed = true;

            if (duration_cast<milliseconds>(now - mob->last_direction_update).count() >= cd)
            {
                mob->last_direction_update = now;
                if (has_target)
                {
                    Player *target = get_player_by_id(mob->target_player_id);

                    mob->angle = std::atan2(target->y - mob->y, target->x - mob->x);

                    mob->next_x = target->x;
                    mob->next_y = target->y;
                }
                else
                {
                    mob->angle = get_random_angle();

                    float dirX = std::cos(mob->angle);
                    float dirY = std::sin(mob->angle);

                    int random_dist = get_random_int(150, 250);

                    float next_x = mob->x + random_dist * dirX,
                          next_y = mob->y + random_dist * dirY;

                    mob->next_x = next_x;
                    mob->next_y = next_y;
                }
            }
            else
            {

                float dx = std::fabs(mob->next_x - mob->x);
                float dy = std::fabs(mob->next_y - mob->y);

                float dist = std::sqrt(dx * dx + dy * dy);

                if (dist > mob->speed)
                {

                    float dirX = std::cos(mob->angle);
                    float dirY = std::sin(mob->angle);

                    // if (mob->collided)
                    // {
                    // mob->next_x = mob->x + (-dirX * 100);
                    // mob->next_y = mob->y + (-dirY * 100);
                    // }

                    mob->x = mob->x + dirX * mob->speed;
                    mob->y = mob->y + dirY * mob->speed;

                    mob->x = std::round(mob->x * 100.0f) / 100.0f;
                    mob->y = std::round(mob->y * 100.0f) / 100.0f;

                    mob->x = std::min((float)width, mob->x);
                    mob->x = std::max((float)0, mob->x);

                    mob->y = std::min((float)height, mob->y);
                    mob->y = std::max((float)0, mob->y);
                }
            }
        }
    }

    void update_world()
    {
        for (auto &p : players)
        {
            if (!p->pending_builds.empty())
            {

                for (pending_build &b : p->pending_builds)
                {

                    vector<Entity *> nearby_entities = get_entities_in_area(b.x - 150, b.y - 150, b.x + 150, b.y + 150);

                    bool cant_build = false;
                    int rad = assign_raduis(b.id);

                    for (Entity *ent : nearby_entities)
                    {

                        if (check_collision(ent->x, ent->y, ent->raduis, b.x, b.y, rad))
                        {
                            cant_build = true;
                            break;
                        };
                    }

                    if (cant_build)
                        continue;

                    if (b.plant)
                    {
                        auto plant = std::make_unique<Plant>(b.id);

                        plant->x = b.x;
                        plant->y = b.y;
                        plant->angle = b.angle;
                        plant->plant = true;
                        plant->id = generate_id();

                        insertEntity(plant.get());
                        plants.push_back(std::move(plant));
                    }
                    else
                    {
                        auto build = std::make_unique<Build>(b.id);
                        build->x = b.x;
                        build->y = b.y;
                        build->angle = b.angle;
                        build->id = generate_id();
                        build->owner = p.get();

                        insertEntity(build.get());
                        buildings.push_back(std::move(build));
                        Packet build_done(PKT_BUILD_DONE);
                        p->decrease_inventory(b.id, 1);
                        p->send(build_done);

                        p->time_stamps.last_build = now;
                    }
                }
                p->pending_builds.clear();
            }
        }

        for (auto &r : resources)
        {
            if (duration_cast<milliseconds>(now - r->last_regen).count() > 5000 && r->amount < r->max_amount)
            {
                r->last_regen = now;
                r->amount = std::min(r->max_amount, r->amount + r->size);
            }
        }
        for (auto &p : plants)
        {
            if (duration_cast<milliseconds>(now - p->last_regen).count() > p->cooldown && p->amount < p->max_amount)
            {
                p->last_regen = now;
                p->amount = std::min(p->max_amount, p->amount + 1);
                p->changed = true;
            }
        }
    }

    void update_buildings()
    {
        for (auto &b : buildings)
        {
            if (!b->updatable)
                continue;

            if (b->info.active)
            {
                if (b->state != STATES.building.on)
                {
                    b->changed = true;
                    b->state = STATES.building.on;
                }
            }
            else if (b->state != STATES.building.off)
            {
                b->changed = true;
                b->state = STATES.building.off;
            }

            if (b->info.players.size() > 0)
            {
                for (auto &p : players)
                    for (auto pid : b->info.players)
                        if (p->id == pid && p->open_build == b->id && (!p->knows_build_info || b->info.updated))
                            p->set_open_build(b->id, b->info.input1, b->info.input2, b->info.amount, b->info.amount_type);
                        else
                            continue;
                b->info.updated = false;
            }

            if (b->info.amount >= b->info.max)
            {
                b->info.active = false;
                continue;
            };

            if (b->info.require_both)
            {
                if (b->info.input1 <= 0 || b->info.input2 <= 0)
                {
                    b->info.active = false;
                    continue;
                }
            }
            else if (b->info.input1 <= 0)
            {
                b->info.active = false;
                continue;
            }

            if (duration_cast<milliseconds>(now - b->info.last_update).count() < b->info.cd)
            {
                if (b->info.require_both && b->info.input1 > 0 && b->info.input2 > 0)
                    b->info.active = true;
                else if (b->info.input1 > 0)
                    b->info.active = true;
                continue;
            }

            if (duration_cast<milliseconds>(now - b->info.last_update).count() > b->info.cd + 1000)
            {
                b->info.last_update = now;
                continue;
            }

            b->info.last_update = now;
            b->info.active = true;

            b->info.updated = true;
            b->changed = true;

            b->info.amount = std::min(b->info.max, b->info.amount + b->info.inc);
            b->info.input1 = std::max(0, b->info.input1 - b->info.dec);
            if (b->info.require_both)
                b->info.input2 = std::max(0, b->info.input2 - b->info.dec);
        }
    }

    void update_grid()
    {
        for (auto &e : entities)
            if (e->changed)
                updateEntityInGrid(e.get(), e->old_x, e->old_y);
        for (auto &p : players)
            if (p->changed)
                updateEntityInGrid(p.get(), p->old_x, p->old_y);
        for (auto &m : mobs)
            if (m->changed)
                updateEntityInGrid(m.get(), m->old_x, m->old_y);
        for (auto &b : buildings)
            if (b->changed)
                updateEntityInGrid(b.get(), b->old_x, b->old_y);
        for (auto &b : boxes)
            if (b->changed)
                updateEntityInGrid(b.get(), b->old_x, b->old_y);
        for (auto &p : plants)
            if (p->changed)
                updateEntityInGrid(p.get(), p->old_x, p->old_y);
    }

    void broadcast_units()
    {
        for (auto &p : players)
        {
            if (!p->connected || !p->alive)
                continue;

            // world resources
            if (!p->world)
            {
                p->world = true;
                Packet world_pkt(PKT_WORLD);
                vector<resource_data> world_data;

                for (auto &res : resources)
                    world_data.emplace_back(resource_data{res->id, res->type, res->x, res->y, res->size, res->angle});

                world_pkt.write(world_data);
                p->send(world_pkt);
            }

            int indentX = 0, indentY = 0;
            auto visible = get_visible(p->x, p->y, p->screen_width + indentX, p->screen_height + indentY);

            // build a set of currently visible IDs for O(1) lookup
            std::unordered_set<int> visible_ids;
            visible_ids.reserve(visible.size());
            for (Entity *e : visible)
                visible_ids.insert(e->id);

            // clean up entities that left the viewport
            std::vector<int> to_forget;
            for (int known_id : p->known_entities)
                if (!visible_ids.count(known_id))
                    to_forget.push_back(known_id);
            for (int id : to_forget)
                p->known_entities.erase(id);

            Packet pkt(PKT_PLAYER_UPDATE);
            vector<unit_data> p_info;

            for (Entity *ent : visible)
            {
                if (!ent->alive)
                    continue;

                bool self = p->id == ent->id;

                bool known = self || p->known_entities.count(ent->id) > 0;

                if (p->refresh_units)
                {
                    if (ent->type == ENTITY_TYPES::PLAYERS)
                    {
                        Player *pl = static_cast<Player *>(ent);
                        p_info.emplace_back(player_data{
                            pl->id, pl->type, pl->x, pl->y, pl->angle,
                            pl->name, pl->right, pl->helmet, pl->attack && pl->can_attack ? 1 : 0});
                        continue;
                    }
                    if (ent->plant)
                    {
                        Plant *plant = static_cast<Plant *>(ent);
                        p_info.emplace_back(plant_data{
                            plant->id, plant->type, plant->amount, plant->x, plant->y, plant->angle, plant->grown, plant->watered});
                        continue;
                    }

                    p_info.emplace_back(entity_data{
                        ent->id, ent->type, ent->x, ent->y, ent->angle, ent->hp, ent->state});
                    continue;
                }
                else if (ent->changed || !known)
                {
                    if (!known)
                        p->known_entities.insert(ent->id);
                    if (ent->type == ENTITY_TYPES::PLAYERS)
                    {
                        Player *pl = static_cast<Player *>(ent);
                        p_info.emplace_back(player_data{
                            pl->id, pl->type, pl->x, pl->y, pl->angle,
                            pl->name, pl->right, pl->helmet, pl->attack && pl->can_attack ? 1 : 0});
                        continue;
                    }
                    if (ent->plant)
                    {
                        Plant *plant = static_cast<Plant *>(ent);
                        p_info.emplace_back(plant_data{
                            plant->id, plant->type, plant->amount, plant->x, plant->y, plant->angle, plant->grown, plant->watered});
                        continue;
                    }
                    p_info.emplace_back(entity_data{
                        ent->id, ent->type, ent->x, ent->y, ent->angle, ent->hp, ent->state});
                    continue;
                }
            }
            if (!p_info.empty())
            {
                pkt.write(p_info);
                p->send(pkt);
            }
            p->refresh_units = false;
        }

        for (auto &e : entities)
            e->changed = false;
        for (auto &m : mobs)
            m->changed = false;
        for (auto &b : buildings)
            b->changed = false;
        for (auto &b : boxes)
            b->changed = false;
        for (auto &p : players)
            p->changed = false;
        for (auto &r : resources)
            r->changed = false;
        for (auto &p : plants)
            p->changed = false;
    }

    // ── Spawn ─────────────────────────────────────────────────────────────────
    Player *spawn_player(tcp::socket sock, int x, int y)
    {
        auto player = std::make_unique<Player>(std::move(sock));

        player->move(x, y);
        player->id = generate_id();
        player->allies.insert(player->id);

        std::lock_guard<std::mutex> lock(mtx);
        player->connected = true;
        player->setup_quests();

        Player *raw_ptr = player.get();
        players.push_back(std::move(player));
        return raw_ptr;
    }

    // ── Kill / wipe ───────────────────────────────────────────────────────────
    void wipe_entities()
    {
        for (auto &e : entities)
            delete e.get();
        entities.clear();
    }

    void wipe_mobs()
    {
        for (auto &m : mobs)
            delete m.get();
        mobs.clear();
    }

    void wipe_buildings()
    {
        for (auto &b : buildings)
            delete b.get();
        buildings.clear();
    }

    bool kill_building(int id)
    {
        for (auto it = buildings.begin(); it != buildings.end(); ++it)
            if ((*it)->id == id)
            {
                (*it).get()->dead();

                Packet dead_pkt(PKT_DEAD);
                dead_pkt.write((*it)->id);
                broadcast(dead_pkt);

                pending_kills.push_back(id);
                return true;
            }
        return false;
    }
    bool kill_building(Build *b)
    {
        b->dead();

        Packet dead_pkt(PKT_DEAD);
        dead_pkt.write(b->id);
        broadcast(dead_pkt);

        pending_kills.push_back(b->id);
        return true;
    }

    bool kill_player(int id)
    {
        for (auto it = players.begin(); it != players.end(); ++it)
            if ((*it)->id == id)
            {
                Packet dead_pkt(PKT_DEAD);
                dead_pkt.write((*it)->id);
                broadcast(dead_pkt);

                pending_kills.push_back(id);
                (*it)->dead();
                (*it)->disconnect();

                removeFromGrid((*it).get());

                auto box = std::make_unique<Box>(ENTITY_TYPES::BOX, true);
                box->x = (*it)->x;
                box->y = (*it)->y;
                box->angle = (*it)->angle;
                box->id = generate_id();
                box->items = (*it)->inventory;

                pending_boxes.push_back(std::move(box));

                for (auto &b : buildings)
                    if (b->owner->id == id)
                        kill_building(b.get());
                return true;
            }
        return false;
    }

    bool kill_mob(int id)
    {
        for (auto it = mobs.begin(); it != mobs.end(); ++it)
            if ((*it)->id == id)
            {
                (*it).get()->dead();

                Packet dead_pkt(PKT_DEAD);
                dead_pkt.write((*it)->id);
                broadcast(dead_pkt);

                auto box = std::make_unique<Box>(ENTITY_TYPES::BOX, true);
                box->x = (*it)->x;
                box->y = (*it)->y;
                box->angle = (*it)->angle;
                box->id = generate_id();

                switch ((*it)->type)
                {
                case ENTITY_TYPES::WOLF:
                    box->items.insert({(int)ItemIds::rawMeat, 2});
                    box->items.insert({(int)ItemIds::blackWolfFur, 1});
                    break;
                case ENTITY_TYPES::RABBIT:
                    box->items.insert({(int)ItemIds::rawMeat, 1});
                    box->items.insert({(int)ItemIds::rabbitFur, 1});
                    break;
                case ENTITY_TYPES::SPIDER:
                    box->items.insert({(int)ItemIds::thread, 2});
                    break;

                default:
                    box->items.insert({(int)ItemIds::rawMeat, 2});
                    box->items.insert({(int)ItemIds::blackWolfFur, 1});
                    break;
                }

                pending_boxes.push_back(std::move(box));

                pending_kills.push_back(id);
                return true;
            }
        return false;
    }

    bool kill_box(int id, int killer_id)
    {
        for (auto it = boxes.begin(); it != boxes.end(); ++it)
            if ((*it)->id == id)
            {
                (*it).get()->dead();

                Packet dead_pkt(PKT_DEAD);
                dead_pkt.write((*it)->id);
                broadcast(dead_pkt);

                auto p = get_player_by_id(killer_id);
                p->add_to_inventory((*it)->items);

                pending_kills.push_back(id);
                return true;
            }
        return false;
    }

    // ── Teleport ──────────────────────────────────────────────────────────────
    void teleport_player(int id, int x, int y)
    {
        Player *p = get_player_by_id(id);
        if (p)
            p->move(x, y);
    }

    // ── ID generator ──────────────────────────────────────────────────────────
    int generate_id()
    {
        if (_used_ids.size() >= 1e5)
            throw std::runtime_error("No available IDs");
        int id;
        do
        {
            id = _dist(_rng);
        } while (_used_ids.count(id));
        _used_ids.insert(id);
        return id;
    }

    void release_id(int id) { _used_ids.erase(id); }

    // ── Lookups ───────────────────────────────────────────────────────────────
    Player *get_player_by_id(int id)
    {
        for (auto &p : players)
            if (p->id == id)
                return p.get();
        return nullptr;
    }

    Entity *get_entity_by_id(int id)
    {
        for (auto &e : entities)
            if (e->id == id)
                return e.get();
        return nullptr;
    }
    Mob *get_mob_by_id(int id)
    {
        for (auto &e : mobs)
            if (e->id == id)
                return e.get();
        return nullptr;
    }

    vector<Entity *> get_entities_in_area(int x1, int y1, int x2, int y2)
    {
        vector<Entity *> result;
        for (auto &e : entities)
            if (e->x >= x1 && e->x <= x2 && e->y >= y1 && e->y <= y2)
                result.push_back(e.get());

        for (auto &e : buildings)
            if (e->x >= x1 && e->x <= x2 && e->y >= y1 && e->y <= y2)
                result.push_back(e.get());

        for (auto &e : mobs)
            if (e->x >= x1 && e->x <= x2 && e->y >= y1 && e->y <= y2)
                result.push_back(e.get());

        for (auto &e : players)
            if (e->x >= x1 && e->x <= x2 && e->y >= y1 && e->y <= y2)
                result.push_back(e.get());

        return result;
    }

    // ── Console commands ──────────────────────────────────────────────────────
    void execute_cmd(const string &cmd)
    {
        istringstream ss(cmd);
        vector<string> words;
        string word;
        while (ss >> word)
            words.push_back(word);
        if (words.empty())
            return;

        if (words[0] == "!kill" && words.size() == 2)
            kill_player(stoi(words[1]));
        else if (words[0] == "!teleport" && words.size() == 4)
            teleport_player(stoi(words[1]), stoi(words[2]), stoi(words[3]));
        else if (words[0] == "!wipe_mobs")
            wipe_mobs();
        else if (words[0] == "!wipe_buildings")
            wipe_entities();
    }

    float get_random_angle()
    {
        float PI = 3.14159265358979323846f;
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<float> dist(0.0f, 2.0f * PI);

        return dist(gen); // angle in radians [0, 2π]
    }

    int get_random_int(int min, int max)
    {
        static std::random_device rd;
        static std::mt19937 gen(rd());
        std::uniform_int_distribution<int> dist(min, max);

        return dist(gen);
    }

    void resolve_collisions()
    {
        bool did_collide = false;

        for (auto &p : players)
        {
            if (!p->alive)
                continue;
            bool in_fire = false,
                 bench = false,
                 chest = false,
                 oven = false,
                 windmill = false,
                 extractor = false,
                 resurection = false;
            for (auto &b : buildings)
            {
                if (!b->alive)
                    continue;
                float pushX, pushY;
                // float half = get_build_half_size(b->type);
                float dist = calc_dist(p->x, b->x, p->y, b->y);

                if (dist > (b->range + b->raduis))
                {
                    if (b->updatable && b->info.players.find(p->id) != b->info.players.end())
                        b->info.players.erase(p->id);
                    continue;
                };

                if (b->updatable && b->info.players.find(p->id) == b->info.players.end())
                    b->info.players.insert(p->id);

                switch (b->type)
                {
                case ENTITY_TYPES::FIRE:
                case ENTITY_TYPES::BIG_FIRE:
                case ENTITY_TYPES::FURNACE:
                    in_fire = true;
                    break;
                case ENTITY_TYPES::WORKBENCH:
                    bench = true;
                    break;
                case ENTITY_TYPES::CHEST:
                    chest = true;
                    break;
                case ENTITY_TYPES::BREAD_OVEN:
                    oven = true;
                    break;
                case ENTITY_TYPES::WINDMILL:
                    windmill = true;
                    break;
                case ENTITY_TYPES::EXTRACTOR_MACHINE_STONE:
                case ENTITY_TYPES::EXTRACTOR_MACHINE_GOLD:
                case ENTITY_TYPES::EXTRACTOR_MACHINE_DIAMOND:
                case ENTITY_TYPES::EXTRACTOR_MACHINE_AMETHYST:
                case ENTITY_TYPES::EXTRACTOR_MACHINE_REIDITE:
                    extractor = true;
                    break;
                case ENTITY_TYPES::RESURRECTION:
                    resurection = true;
                    break;
                case ENTITY_TYPES::SPIKE:
                case ENTITY_TYPES::STONE_SPIKE:
                case ENTITY_TYPES::GOLD_SPIKE:
                case ENTITY_TYPES::DIAMOND_SPIKE:
                case ENTITY_TYPES::AMETHYST_SPIKE:
                case ENTITY_TYPES::REIDITE_SPIKE:

                    if (duration_cast<Ms>(now - p->time_stamps.last_spike_damage).count() >= 2000 && b->owner->allies.find(p->id) == b->owner->allies.end())
                    {
                        p->hp -= b->dmg;
                        p->time_stamps.last_spike_damage = now;

                        p->send_gauges();

                        if (p->hp <= 0)
                        {
                            kill_player(p->id);
                            continue;
                        };
                    };
                    break;

                default:
                    break;
                }

                if (!p->connected)
                    continue;

                if (circle_vs_circle(p->x, p->y, p->raduis, b->x, b->y, b->raduis, pushX, pushY))
                {
                    p->x += pushX;
                    p->y += pushY;
                    p->changed = true;
                    p->collided = true;
                    did_collide = true;
                }
            }
            for (auto &r : resources)
            {
                float pushX, pushY;
                // float half = get_build_half_size(r->type);
                if (circle_vs_circle(p->x, p->y, p->raduis, r->x, r->y, r->raduis, pushX, pushY))
                {
                    p->x += pushX;
                    p->y += pushY;
                    p->changed = true;
                    p->collided = true;
                    did_collide = true;
                }
            }
            for (auto &plant : plants)
            {
                float pushX, pushY;
                // float half = get_build_half_size(plant->type);
                if (circle_vs_circle(p->x, p->y, p->raduis, plant->x, plant->y, plant->raduis, pushX, pushY))
                {
                    p->x += pushX;
                    p->y += pushY;
                    p->changed = true;
                    p->collided = true;
                    did_collide = true;
                }
            }
            if (!did_collide)
                p->collided = false;

            if (
                in_fire != p->in_fire ||
                bench != p->bench ||
                chest != p->chest ||
                oven != p->oven ||
                windmill != p->windmill ||
                extractor != p->extractor ||
                resurection != p->resurection)
            {
                p->in_fire = in_fire;
                p->bench = bench;
                p->chest = chest;
                p->oven = oven;
                p->windmill = windmill;
                p->extractor = extractor;
                p->resurection = resurection;

                Packet building_state(PKT_BUILDINGS_STATE);
                building_state.write(p->in_water);
                building_state.write(in_fire);
                building_state.write(bench);
                building_state.write(chest);
                building_state.write(oven);
                building_state.write(windmill);
                building_state.write(extractor);
                building_state.write(resurection);

                p->send(building_state);
            }
        }

        for (auto &m : mobs)
        {
            if (!m->alive)
                continue;
            for (auto &b : buildings)
            {
                if (!b->alive)
                    continue;
                float pushX, pushY;
                // float half = get_build_half_size(b->type);
                if (circle_vs_circle(m->x, m->y, m->raduis, b->x, b->y, b->raduis, pushX, pushY))
                {
                    m->x += pushX;
                    m->y += pushY;
                    m->changed = true;
                    m->collided = true;
                }
            }
            for (auto &r : resources)
            {
                float pushX, pushY;
                // float half = get_build_half_size(r->type);
                if (circle_vs_circle(m->x, m->y, m->raduis, r->x, r->y, r->raduis, pushX, pushY))
                {
                    m->x += pushX;
                    m->y += pushY;
                    m->changed = true;
                    m->collided = true;
                }
            }
            for (auto &plant : plants)
            {
                float pushX, pushY;
                // float half = get_build_half_size(plant->type);
                if (circle_vs_circle(m->x, m->y, m->raduis, plant->x, plant->y, plant->raduis, pushX, pushY))
                {
                    m->x += pushX;
                    m->y += pushY;
                    m->changed = true;
                    m->collided = true;
                }
            }
        }
    }
};
