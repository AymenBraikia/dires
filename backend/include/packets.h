#pragma once
#include <vector>
#include <string>
#include <cstring>
#include <cstdint>
#include <variant>
#include <asio.hpp>
#include "socket_utils.h"
#include "types.h"

using asio::ip::tcp;

enum PacketID : uint8_t
{
    PKT_HANDSHAKE = 0,
    PKT_PLAYER_MOVE = 1,
    PKT_PLAYER_ATTACK = 2,
    PKT_LEADERBOARD = 3,
    PKT_PLAYER_EQUIP = 5,
    PKT_PLAYER_ANGLE = 4,
    PKT_PLAYER_PLACE = 6,
    PKT_PLAYER_UPDATE = 7,
    PKT_PLAYER_GAUGES = 8,
    PKT_CHAT = 9,
    PKT_PLAYER_STOP_ATTACK = 10,
    PKT_RAIN = 11,
    PKT_SANDSTORM = 12,
    PKT_BLIZZARD = 13,
    PKT_DEAD = 14,
    PKT_DELETE = 15,
    PKT_CRAFT = 16,
    PKT_TEAM_CREATE = 17,
    PKT_TEAM_JOIN = 18,
    PKT_TEAM_LEAVE = 19,
    PKT_TEAM_LIST = 20,
    PKT_TEAM_DELETE = 21,
    PKT_DROP_ONE = 22,
    PKT_DROP_ALL = 23,
    PKT_ADMIN_CMD = 24,
    PKT_CLAIM = 25,
    PKT_ITEM_PUT = 26,
    PKT_ITEM_TAKE = 27,
    PKT_SET_BUILDING = 28,
    PKT_TPS = 29,
    PKT_REFRESH = 30,
    PKT_INV = 31,
    PKT_SCREEN = 32,
    PKT_WORLD = 33,
    PKT_MESSAGE = 34,
    PKT_BUILD_DONE = 35,
    PKT_PING = 36,
    PKT_BUILDINGS_STATE = 37,
    PKT_BUILD_OPEN = 38,
    PKT_QUESTS = 39,
};

enum class T : uint8_t
{
    INT32 = 1,
    FLOAT = 2,
    BOOL = 3,
    STRING = 4,
    ARRAY = 5,
    ARRAY2D = 6,
};

// ─── Packet builder ───────────────────────────────────────────────────────────
class Packet
{
    std::vector<uint8_t> buf;

    void pushBytes(const void *src, size_t n)
    {
        const uint8_t *p = reinterpret_cast<const uint8_t *>(src);
        buf.insert(buf.end(), p, p + n);
    }

public:
    Packet(PacketID id) { buf.push_back((uint8_t)id); }

    Packet &write(int32_t v)
    {
        buf.push_back((uint8_t)T::INT32);
        pushBytes(&v, 4);
        return *this;
    }

    Packet &write(float v)
    {
        buf.push_back((uint8_t)T::FLOAT);
        pushBytes(&v, 4);
        return *this;
    }

    Packet &write(bool v)
    {
        buf.push_back((uint8_t)T::BOOL);
        buf.push_back(v ? 1 : 0);
        return *this;
    }

    Packet &write(const std::string &s)
    {
        buf.push_back((uint8_t)T::STRING);
        uint16_t len = (uint16_t)s.size();
        pushBytes(&len, 2);
        pushBytes(s.data(), s.size());
        return *this;
    }

    Packet &write(const std::unordered_map<int, int> &v)
    {
        buf.push_back((uint8_t)T::ARRAY2D);
        uint16_t len = (uint16_t)v.size();
        pushBytes(&len, 2);
        for (const auto &[key, value] : v)
        {
            std::vector<int32_t> pair = {key, value};
            write(pair); // writes ARRAY tag + len + two int32s
        }
        return *this;
    }

    Packet &write(const std::vector<int32_t> &v)
    {
        buf.push_back((uint8_t)T::ARRAY);
        uint16_t len = (uint16_t)v.size();
        pushBytes(&len, 2);
        for (int32_t item : v)
            pushBytes(&item, 4);
        return *this;
    }

    Packet &write(const std::vector<std::vector<int32_t>> &v)
    {
        buf.push_back((uint8_t)T::ARRAY2D);
        uint16_t len = (uint16_t)v.size();
        pushBytes(&len, 2);
        for (const auto &inner : v)
            write(inner);
        return *this;
    }

    Packet &write(const entity_data &e)
    {
        buf.push_back((uint8_t)T::ARRAY);
        uint16_t len = 7;
        pushBytes(&len, 2);
        // each field carries its own type tag
        write(e.id);    // INT32 tag + value
        write(e.type);  // INT32 tag + value
        write(e.x);     // FLOAT tag + value
        write(e.y);     // FLOAT tag + value
        write(e.angle); // FLOAT tag + value
        write(e.hp);    // INT32 tag + value
        write(e.state); // INT32 tag + value
        return *this;
    }

    Packet &write(const std::vector<entity_data> &v)
    {
        write((int32_t)v.size()); // outer count
        for (const auto &e : v)
            write(e); // each entity as its own inner array
        return *this;
    }

    Packet &write(const std::vector<player_data> &v)
    {
        write((int32_t)v.size()); // outer count
        for (const auto &e : v)
            write(e); // each entity as its own inner array
        return *this;
    }
    Packet &write(const player_data &e)
    {
        buf.push_back((uint8_t)T::ARRAY);
        uint16_t len = 9;
        pushBytes(&len, 2);
        // each field carries its own type tag
        write(e.id);     // INT32 tag + value
        write(e.type);   // INT32 tag + value
        write(e.x);      // FLOAT tag + value
        write(e.y);      // FLOAT tag + value
        write(e.angle);  // FLOAT tag + value
        write(e.name);   // STRING tag + value
        write(e.right);  // INT32 tag + value
        write(e.helmet); // INT32 tag + value
        write(e.attack); // INT32 tag + value
        return *this;
    }

    Packet &write(const std::vector<plant_data> &v)
    {
        write((int32_t)v.size()); // outer count
        for (const auto &e : v)
            write(e); // each entity as its own inner array
        return *this;
    }
    Packet &write(const plant_data &e)
    {
        buf.push_back((uint8_t)T::ARRAY);
        uint16_t len = 8;
        pushBytes(&len, 2);

        write(e.id);
        write(e.type);
        write(e.amount);
        write(e.x);
        write(e.y);
        write(e.angle);
        write(e.grown);
        write(e.watered);
        return *this;
    }

    Packet &write(const resource_data &e)
    {
        buf.push_back((uint8_t)T::ARRAY);
        uint16_t len = 6;
        pushBytes(&len, 2);
        // each field carries its own type tag
        write(e.id);    // INT32 tag + value
        write(e.type);  // INT32 tag + value
        write(e.x);     // INT32 tag + value
        write(e.y);     // INT32 tag + value
        write(e.s);     // INT32 tag + value
        write(e.angle); // FLOAT tag + value
        return *this;
    }

    Packet &write(const std::vector<resource_data> &v)
    {
        write((int32_t)v.size());
        for (const auto &e : v)
            write(e);
        return *this;
    }

    Packet &write(const unit_data &u)
    {
        std::visit([this](const auto &e)
                   { this->write(e); }, u);
        return *this;
    }

    Packet &write(const std::vector<unit_data> &v)
    {
        write((int32_t)v.size());
        for (const auto &u : v)
            write(u);
        return *this;
    }

    void send(tcp::socket &sock) { wsSend(sock, buf); }
};

// ─── Packet reader ────────────────────────────────────────────────────────────
class PacketReader
{
    const uint8_t *buf;
    size_t offset = 0;
    size_t size;

    uint8_t readByte() { return buf[offset++]; }

    int32_t _readInt32()
    {
        int32_t v;
        memcpy(&v, buf + offset, 4);
        offset += 4;
        return v;
    }

    float _readFloat()
    {
        float v;
        memcpy(&v, buf + offset, 4);
        offset += 4;
        return v;
    }

    bool _readBool() { return buf[offset++] == 1; }

    std::string _readString()
    {
        uint16_t len;
        memcpy(&len, buf + offset, 2);
        offset += 2;
        std::string s((char *)buf + offset, len);
        offset += len;
        return s;
    }

public:
    using Value = std::variant<int32_t, float, bool, std::string>;

    struct ParsedPacket
    {
        uint8_t id;
        std::vector<Value> args;
    };

    PacketReader(const uint8_t *data, size_t size) : buf(data), size(size) {}

    ParsedPacket parse()
    {
        ParsedPacket pkt;
        pkt.id = readByte();

        while (offset < size)
        {
            if (offset >= size)
                break;
            uint8_t tag = readByte();
            switch (tag)
            {
            case (uint8_t)T::INT32:
                pkt.args.push_back(_readInt32());
                break;
            case (uint8_t)T::FLOAT:
                pkt.args.push_back(_readFloat());
                break;
            case (uint8_t)T::BOOL:
                pkt.args.push_back(_readBool());
                break;
            case (uint8_t)T::STRING:
                pkt.args.push_back(_readString());
                break;
            default:
                std::cerr << "Unknown tag: " << (int)tag << " at offset " << offset << "\n";
                goto done; // bail out, packet is corrupt
            }
        }
    done:
        return pkt;
    }
};