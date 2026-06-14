#pragma once
#include <string>
#include <chrono>
#include <vector>
#include <set>
#include <asio.hpp>

#include "./entity.h"
#include "../packets.h"
#include "../server.h"
#include "../types.h"
#include "../ids.h"
#include "../recipe.h"

using namespace std::chrono;
using namespace std;
using asio::ip::tcp;

struct Effects
{
    int bandage = 0;
};
struct Gauges
{
    int temprature = 100;
    int oxygen = 100;
    int hunger = 100;
    int thirst = 100;
};

struct TimeStamps
{
    // buildings
    system_clock::time_point last_spike_damage = system_clock::now();
    // forest
    system_clock::time_point last_spider_damage = system_clock::now();
    system_clock::time_point last_wolf_damage = system_clock::now();
    system_clock::time_point last_boar_damage = system_clock::now();
    system_clock::time_point last_hawk_damage = system_clock::now();
    system_clock::time_point last_crab_damage = system_clock::now();
    system_clock::time_point last_crab_king_damage = system_clock::now();
    // winter
    system_clock::time_point last_fox_damage = system_clock::now();
    system_clock::time_point last_bear_damage = system_clock::now();
    system_clock::time_point last_baby_mamoth_damage = system_clock::now();
    system_clock::time_point last_mamoth_damage = system_clock::now();
    system_clock::time_point last_baby_dragon_damage = system_clock::now();
    system_clock::time_point last_dragon_damage = system_clock::now();
    // lava
    system_clock::time_point last_lava_monster_damage = system_clock::now();
    system_clock::time_point last_baby_lava_dragon_damage = system_clock::now();
    system_clock::time_point last_lava_dragon_damage = system_clock::now();
    // ocean
    system_clock::time_point last_fish_damage = system_clock::now();
    system_clock::time_point last_kraken_damage = system_clock::now();
    // desert
    system_clock::time_point last_vulture_damage = system_clock::now();
    system_clock::time_point last_sand_worm_damage = system_clock::now();

    // world
    system_clock::time_point last_blizzard_damage = system_clock::now();
    system_clock::time_point last_sandstorm_damage = system_clock::now();
    // self
    system_clock::time_point last_build = system_clock::now();
    system_clock::time_point last_attack = system_clock::now();
    system_clock::time_point last_gauges_update = system_clock::now();
};

struct quest
{
    int id, score = 0, reward;
    bool failled = false, completed = false, claimed = false, savage, treasure, chest, box, kit;
};

struct pending_build
{
    float angle = 0,
          x = 0,
          y = 0;
    int id = -1;
    bool plant = false;
};
struct pending_put
{
    int id = -1,
        item_id = -1,
        amount = 0;
};

struct quest_data
{
    int score, reward;
    bool savage = false, treasure = false, chest = false, box = false, kit = false, take_damage = false;
};

class Player : public Entity
{
private:
public:
    std::string name = "Aymen";
    std::unordered_set<int> allies;

    int right = -1,
        helmet = -1,
        screen_width = 0,
        screen_height = 0,
        max_slots = 16,
        open_build = -1,
        protection = 0,
        buff = 0,
        direction = 0;

    std::unordered_map<string, quest> quests;

    std::atomic<bool> connected{false};

    bool can_attack = true,
         attack = false,
         heal = false,
         refresh_units = false,
         world = false,
         in_water = true,
         in_fire = false,
         bench = false,
         windmill = false,
         oven = false,
         chest = false,
         extractor = false,
         resurection = false,
         crafting = false,
         knows_build_info = false,
         collided = false;

    unordered_set<int> known_entities;
    asio::ip::tcp::socket socket;
    std::mutex socket_mtx;

    // {ItemIds::berrySeeds, 1000},
    // {ItemIds::wheatSeeds, 1000},
    // {ItemIds::pumpkinSeeds, 1000},
    // {ItemIds::carrotSeeds, 1000},
    // {ItemIds::tomatoSeeds, 1000},
    // {ItemIds::garlicSeeds, 1000},
    // {ItemIds::watermelonSeeds, 1000},
    // {ItemIds::aloeVeraSeeds, 1000},
    std::unordered_map<int, int> inventory = {
        {ItemIds::satanSpear, 1},
        {ItemIds::satanHelmet, 1},
        {ItemIds::breadOven, 10},
        {ItemIds::chest, 10},
        {ItemIds::wheat, 10000},
        {ItemIds::flour, 10000},
        {ItemIds::reiditeSpike, 10000},

        {ItemIds::book, 1},
        {ItemIds::wood, 10000},
        {ItemIds::stone, 10000},
        {ItemIds::gold, 10000},
        {ItemIds::diamond, 10000},
        {ItemIds::amethyst, 10000},
        {ItemIds::reidite, 10000},
        {ItemIds::emerald, 10000},
        // {ItemIds::reiditeWall, 1000},
        // {ItemIds::reiditePickaxe, 1},
    }; // 10 inventory slots, each slot has [item_id, amount]

    TimeStamps time_stamps;
    Gauges gauges;
    Effects effects;

    vector<pending_build> pending_builds = {};
    vector<pending_put> pending_puts = {};
    vector<int> pending_takes = {};
    vector<pair<int, int>> pending_drops = {};

    std::atomic<bool> thread_done{false};

    Player(asio::ip::tcp::socket sock) : Entity(ENTITY_TYPES::PLAYERS), socket(std::move(sock))
    {
        this->hp = 200;
        this->speed = 10;
    };
    // player init
    void setup_quests()
    {
        vector<string> quest_names = {"satan_rune", "satan_shard", "demonic_rune", "demonic_shard", "orange_gem", "blue_gem", "green_gem"};
        for (int i = 0; i < 7; i++)
        {
            quest q;
            q.id = i;
            auto data = get_quest_data(i);

            quests.insert({quest_names[i], q});
        }
    }

    // player utils
    bool find_item_in_inventory(int item_id)
    {
        return inventory.find(item_id) != inventory.end();
    };
    bool has_item_amount_in_inventory(int item_id, int amount)
    {
        auto it = inventory.find(item_id);
        return it != inventory.end() ? it->second >= amount : false;
    };
    int get_item_in_inventory(int item_id)
    {
        auto i = inventory.find(item_id);
        return i != inventory.end() ? i->second : 0;
    };

    void wipe_inventory()
    {
        inventory.clear();
    };
    void add_to_inventory(std::unordered_map<int, int> items)
    {
        bool added = false;
        int index = 0;

        for (const auto &[id, amount] : items)
        {
            auto inv_i = inventory.find(id);

            if (inv_i == inventory.end())
            {
                if (inventory.size() == max_slots)
                {
                    send_msg(std::string("your inventory is full right click an item to drop it"));
                    if (added)
                        send_inv();
                    return;
                }
                added = true;
                inventory.insert({id, amount});
            }
            else
            {
                inventory.at(inv_i->first) = inv_i->second + amount;
                added = true;
            };
        }

        send_inv();
    };
    void add_to_inventory(vector<std::pair<int, int>> items)
    {
        bool added = false;
        int index = 0;
        for (int i = 0; i < items.size(); i++)
        {
            auto item = items[index];
            index++;
            auto inv_i = inventory.find(item.first);

            if (inv_i == inventory.end())
            {
                if (inventory.size() == max_slots)
                {
                    send_msg(std::string("your inventory is full right click an item to drop it"));
                    if (added)
                        send_inv();
                    return;
                }
                added = true;
                inventory.insert({item.first, item.second});
            }
            else
            {
                inventory.at(inv_i->first) = inv_i->second + item.second;
                added = true;
            };
        }

        send_inv();
    };
    void add_to_inventory(int id, int amount)
    {

        std::pair<int, int> item = {id, amount};

        auto inv_i = inventory.find(item.first);

        if (inv_i == inventory.end()) // not found
        {
            if (inventory.size() == max_slots)
            {
                send_msg(std::string("your inventory is full right click an item to drop it"));
                return;
            }
            inventory.insert({item.first, item.second});
        }
        else
            inventory.at(inv_i->first) = inv_i->second + item.second;
        send_inv();
    };

    void decrease_inventory(int id, int amount)
    {

        std::pair<int, int> item = {id, amount};

        auto inv_i = inventory.find(item.first);

        if (inv_i != inventory.end())
        {
            inventory.at(inv_i->first) = inv_i->second - item.second;
            send_inv();
            if (inventory.at(inv_i->first) <= 0)
            {
                inventory.erase(id);
                return;
            };
        }
        send_inv();
    };

    void decrease_inventory(std::pair<int, int> item)
    {

        auto inv_i = inventory.find(item.first);

        if (inv_i != inventory.end())
        {
            inventory.at(inv_i->first) = inv_i->second - item.second;
            send_inv();
            if (inventory.at(inv_i->first) <= 0)
            {
                inventory.erase(id);
                return;
            };
        }
        send_inv();
    };

    void set_open_build(int id)
    {
        Packet pkt_open_build(PKT_BUILD_OPEN);
        pkt_open_build.write(id);
        send(pkt_open_build);

        knows_build_info = false;

        open_build = id;
    }
    void set_open_build(int id, int i1, int i2, int amount, int type)
    {
        Packet pkt_open_build(PKT_BUILD_OPEN);
        pkt_open_build.write(id);
        pkt_open_build.write(i1);
        pkt_open_build.write(i2);
        pkt_open_build.write(amount);
        pkt_open_build.write(type);
        send(pkt_open_build);

        knows_build_info = true;

        open_build = id;
    }

    void craft(int id)
    {
        auto it = RECIPES.find(id);
        if (it == RECIPES.end())
            return;
        auto r = it->second;

        for (auto v : r.variants)
        {
            bool can = true;

            vector<std::pair<int, int>> reqs = {};

            if (v.fire && !this->in_fire || v.water && !this->in_water || v.bench && !this->bench)
                continue;

            for (auto i : v.ingredients)
            {
                if (!has_item_amount_in_inventory(i.first, i.second))
                {
                    can = false;
                    break;
                };
                reqs.push_back({i.first, i.second});
            }

            if (!can)
                continue;

            for (auto req : reqs)
                this->decrease_inventory(req.first, req.second);

            crafting = true;
            can_attack = false;

            std::thread([this, r, id]
                        {
                    std::this_thread::sleep_for(std::chrono::milliseconds(right == ItemIds::book ?(int)(r.duration * 0.8):r.duration));
                        crafting = false;
                        can_attack = true;
                        this->add_to_inventory(id, 1);
                
                        send_inv(); })
                .detach();
        }
    };

    void send_inv()
    {
        Packet pkt_inv(PKT_INV);
        pkt_inv.write(inventory);
        this->send(pkt_inv);
    }
    void send_msg(std::string msg)
    {
        Packet m(PKT_MESSAGE);
        m.write(msg);
        send(m);
    }

    void tick()
    {
        gauges.hunger = std::max(gauges.hunger - 5, 0);
        gauges.thirst = std::max(gauges.thirst - 2, 0);
        gauges.temprature = std::max(gauges.temprature - 10, 0);

        if (heal)
            hp = std::min(effects.bandage > 0 ? hp + 40 : hp + 10, 200);

        heal = !heal;

        time_stamps.last_gauges_update = system_clock::now();
        changed = true;

        send_gauges();
    }

    void send_quests()
    {
        cout << "sending quests\n";
        Packet pkt(PKT_QUESTS);
        vector<int> data = {};
        for (auto &[e, v] : quests)
        {
            cout << e << " ";
            vector<int> d = {v.id, v.failled ? 1 : 0, v.completed ? 1 : 0, v.claimed ? 1 : 0};
            // data.push_back(d);
        }
        pkt.write(data);

        send(pkt);
    }
    void send_gauges()
    {
        Packet pkt(PKT_PLAYER_GAUGES);

        pkt.write(hp)
            .write(gauges.hunger)
            .write(gauges.temprature)
            .write(gauges.thirst)
            .write(gauges.oxygen);

        send(pkt);
    }

    void disconnect()
    {
        std::lock_guard<std::mutex> lock(socket_mtx);
        if (!connected)
            return;
        connected = false;

        asio::error_code ec;
        socket.shutdown(tcp::socket::shutdown_both, ec); // ec version won't throw
        socket.close(ec);
    }

    void set_buff(int weapon)
    {
        switch (weapon)
        {
        // case ItemIds::stoneBow:
        case ItemIds::stoneAxe:
        case ItemIds::stoneSpear:
        case ItemIds::stoneSword:
            if (helmet == ItemIds::stoneHelmet)
            {
                buff = 3;
            };
            break;
        // case ItemIds::goldBow:
        case ItemIds::goldAxe:
        case ItemIds::goldSpear:
        case ItemIds::goldSword:
            if (helmet == ItemIds::goldHelmet)
            {
                buff = 3;
            };
            break;
        // case ItemIds::diamondBow:
        case ItemIds::diamondAxe:
        case ItemIds::diamondSpear:
        case ItemIds::diamondSword:
            if (helmet == ItemIds::diamondHelmet)
            {
                buff = 3;
            };
            break;
        // case ItemIds::amethystBow:
        case ItemIds::amethystAxe:
        case ItemIds::amethystSpear:
        case ItemIds::amethystSword:
            if (helmet == ItemIds::amethystHelmet)
            {
                buff = 3;
            };
            break;
        // case ItemIds::reiditeBow:
        case ItemIds::reiditeAxe:
        case ItemIds::reiditeSpear:
        case ItemIds::reiditeSword:
            if (helmet == ItemIds::reiditeHelmet)
            {
                buff = 3;
            };
            break;
        // case ItemIds::demonicBow:
        case ItemIds::demonicAxe:
        case ItemIds::demonicSpear:
        case ItemIds::demonicSword:
            if (helmet == ItemIds::demonicHelmet)
            {
                buff = 3;
            };
            break;
        // case ItemIds::satanBow:
        case ItemIds::satanAxe:
        case ItemIds::satanSpear:
        case ItemIds::satanSword:
            if (helmet == ItemIds::satanHelmet)
            {
                buff = 3;
            };
            break;
        default:
            buff = 0;
            break;
        }
    }

    quest_data get_quest_data(int id)
    {
        quest_data data;
        switch (id)
        {
        case 0:
        case 1:
        case 2:
        case 3:
            data.box = true;
            data.treasure = true;
            data.chest = true;
            data.kit = true;
            break;
        case 4:
            break;
        case 5:
            data.savage = true;
            break;
        case 6:
            data.box = true;
            data.treasure = true;
            data.chest = true;
            data.kit = true;
            data.take_damage = true;
            break;
        }
        return data;
    }
    void set_protection(int helmet)
    {
        switch (helmet)
        {
        case ItemIds::stoneHelmet:
            protection = 2;
            break;
        case ItemIds::goldHelmet:
            protection = 4;
            break;
        case ItemIds::diamondHelmet:
            protection = 6;
            break;
        case ItemIds::amethystHelmet:
            protection = 8;
            break;
        case ItemIds::reiditeHelmet:
            protection = 10;
            break;
        case ItemIds::demonicHelmet:
            protection = 12;
            break;
        case ItemIds::satanHelmet:
            protection = 15;
            break;
        default:
            protection = 0;
            break;
        }
    }
    void consume(int consumable)
    {
        switch (consumable)
        {
        case ItemIds::raw_fish:
        case ItemIds::rawMeat:
            gauges.hunger = std::min(100, gauges.hunger + 15);
            hp = std::max(0, hp - 10);
            decrease_inventory(consumable, 1);
            break;
        case ItemIds::cookedFish:
        case ItemIds::cookedMeat:
            gauges.hunger = std::min(100, gauges.hunger + 35);
            decrease_inventory(consumable, 1);
            break;

        case ItemIds::berries:
            gauges.hunger = std::min(100, gauges.hunger + 10);
            decrease_inventory(consumable, 1);
            break;
        case ItemIds::cookies:
        case ItemIds::pumpkin:
            gauges.hunger = std::min(100, gauges.hunger + 30);
            decrease_inventory(consumable, 1);
            break;

        case ItemIds::bread:
        case ItemIds::carrot:
            gauges.hunger = std::min(100, gauges.hunger + 20);
            decrease_inventory(consumable, 1);
            break;
        case ItemIds::tomato:
            gauges.hunger = std::min(100, gauges.hunger + 15);
            decrease_inventory(consumable, 1);
            break;
        case ItemIds::garlic:
            gauges.hunger = std::min(100, gauges.hunger + 20);
            decrease_inventory(consumable, 1);
            break;

        case ItemIds::cactus:
        case ItemIds::watermelon:
            gauges.hunger = std::min(100, gauges.hunger + 20);
            gauges.thirst = std::min(100, gauges.thirst + 20);
            decrease_inventory(consumable, 1);
            break;

        case ItemIds::sandwich:
            gauges.hunger = std::min(100, gauges.hunger + 100);
            decrease_inventory(consumable, 1);
            break;
        case ItemIds::water_bottle:
            gauges.thirst = std::min(100, gauges.thirst + 60);
            decrease_inventory(consumable, 1);
            add_to_inventory(ItemIds::bottle, 1);
            break;
        case ItemIds::aloeVera:
            effects.bandage = std::min(20, effects.bandage + 1);
            decrease_inventory(consumable, 1);
            break;

        case ItemIds::bandage:
            effects.bandage = std::min(20, effects.bandage + 5);
            decrease_inventory(consumable, 1);
            break;
        }
        send_gauges();
    }

    void send(Packet &pkt)
    {
        std::lock_guard<std::mutex> lock(socket_mtx);
        if (!connected || !alive)
            return;
        try
        {
            pkt.send(this->socket);
        }
        catch (const asio::system_error &)
        {
            connected = false;
        }
    }

    void socket_handler()
    {
        try
        {
            while (connected && alive)
            {
                std::vector<uint8_t> raw = wsReceive(this->socket);
                PacketReader reader(raw.data(), raw.size());
                auto [id, args] = reader.parse();

                switch (id)
                {
                case PKT_PLAYER_MOVE:
                {
                    this->direction = std::get<int>(args[1]);
                    break;
                }
                case PKT_PLAYER_STOP_ATTACK:
                {
                    this->attack = false;
                    changed = true;
                    break;
                }
                case PKT_PLAYER_ATTACK:
                {
                    this->attack = true;
                    changed = true;
                    break;
                }
                case PKT_REFRESH:
                {
                    this->refresh_units = true;
                    changed = true;
                    break;
                }
                case PKT_PLAYER_EQUIP:
                {
                    int item_id = std::get<int>(args[1]);

                    if (!find_item_in_inventory(item_id))
                        break;
                    bool is_consumable = std::find(consumables.begin(), consumables.end(), item_id) != consumables.end();
                    if (is_consumable)
                    {
                        consume(item_id);
                        break;
                    }

                    bool is_tool = std::find(tools.begin(), tools.end(), item_id) != tools.end();
                    if (is_tool)
                    {
                        right = right != item_id ? item_id : -1;
                        set_buff(item_id);
                        break;
                    }

                    bool is_helmet = std::find(helmets.begin(), helmets.end(), item_id) != helmets.end();
                    if (is_helmet)
                    {
                        helmet = helmet != item_id ? item_id : -1;
                        set_protection(item_id);
                    }
                    changed = true;
                    break;
                }
                case PKT_PLAYER_ANGLE:
                {
                    if (std::holds_alternative<float>(args[1]))
                        this->angle = std::get<float>(args[1]);
                    else
                        this->angle = (float)std::get<int>(args[1]);
                    changed = true;
                    break;
                }
                case PKT_SCREEN:
                {
                    this->screen_width = std::min(4000, std::get<int>(args[1]));
                    this->screen_height = std::min(2500, std::get<int>(args[2]));
                    break;
                }
                case PKT_PLAYER_PLACE:
                {
                    if (std::chrono::duration_cast<milliseconds>(std::chrono::system_clock::now() - time_stamps.last_build).count() < 1000)
                        break;
                    int build_id = std::get<int>(args[1]);
                    bool gridMode = std::get<bool>(args[2]);

                    if (std::find(buildings_ids.begin(), buildings_ids.end(), build_id) == buildings_ids.end() || !find_item_in_inventory(build_id))
                        break;

                    pending_build build;
                    if (std::find(plants.begin(), plants.end(), build_id) != plants.end())
                        build.plant = true;

                    float build_x = x + 120 * std::cos(angle),
                          build_y = y + 120 * std::sin(angle);

                    build.id = build_id;
                    build.x = gridMode ? std::round(build_x / 100.0f) * 100.0f : build_x;
                    build.y = gridMode ? std::round(build_y / 100.0f) * 100.0f : build_y;
                    build.angle = gridMode ? 0 : angle;

                    pending_builds.push_back(build);

                    break;
                }
                case PKT_HANDSHAKE:
                {
                    this->name = std::get<string>(args[1]);
                    this->screen_width = std::get<int>(args[4]);
                    this->screen_height = std::get<int>(args[5]);

                    this->send(Packet(PKT_HANDSHAKE)
                                   .write((int32_t)this->id)
                                   .write(this->name)
                                   .write(this->x)
                                   .write(this->y)
                                   .write(this->inventory)
                                   .write(this->hp)
                                   .write(this->gauges.hunger)
                                   .write(this->gauges.temprature)
                                   .write(this->gauges.thirst)
                                   .write(this->gauges.thirst)
                                   .write(this->gauges.oxygen)
                                   .write(this->angle)
                                   .write(this->helmet)
                                   .write(this->right));

                    break;
                }
                case PKT_CRAFT:
                {
                    if (!crafting)
                    {
                        int id = std::get<int>(args[1]);
                        craft(id);
                    }
                    break;
                }
                case PKT_PING:
                {
                    Packet pong(PKT_PING);
                    send(pong);
                    break;
                }
                case PKT_ITEM_PUT:
                {
                    // [b_id, put_item_id, amount]
                    int id = std::get<int>(args[1]);
                    int item_id = std::get<int>(args[2]);
                    int amount = std::get<int>(args[3]);

                    pending_put req;

                    req.id = id;
                    req.item_id = item_id;
                    req.amount = amount;

                    pending_puts.push_back(req);
                    break;
                }
                case PKT_ITEM_TAKE:
                {
                    int bid = std::get<int>(args[1]);

                    if (bid > -1)
                        pending_takes.push_back(bid);
                }
                break;
                case PKT_DROP_ONE:
                {
                    int id = std::get<int>(args[1]);
                    int a = get_item_in_inventory(id);
                    if (a > 0)
                    {
                        pair i = {id, 1};
                        pending_drops.push_back(i);
                    }
                    break;
                }
                case PKT_DROP_ALL:
                {
                    int id = std::get<int>(args[1]);
                    int a = get_item_in_inventory(id);
                    if (a > 0)
                    {
                        pair i = {id, a};
                        pending_drops.push_back(i);
                    }
                    break;
                }
                case PKT_CHAT:
                {
                    std::string msg = std::get<std::string>(args[0]);
                    changed = true;
                    break;
                }
                default:
                    // cout << "unknown tag = disconnecting\n";
                    // disconnect();
                    break;
                }
            }
        }
        catch (const asio::system_error &e)
        {
            if (connected == false)
            {
                connected = false;
                alive = false;
                thread_done = true;

                return;
            };
            if (e.code() == asio::error::eof ||
                e.code() == asio::error::connection_reset ||
                e.code() == asio::error::connection_aborted)
                disconnect();
            else
            {
                cout << "Socket error: " << e.what() << "\n";
            };
        }
        connected = false;
        // alive = false;
        thread_done = true;
    }
};
