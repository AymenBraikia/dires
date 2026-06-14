#pragma once
#include <iostream>
#include <sstream>
#include <string>
#include <array>
#include <vector>
#include <stdexcept>
#include <asio.hpp>

using asio::ip::tcp;

// ─── Constants ────────────────────────────────────────────────────────────────
static const std::string WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

// ─── SHA1 ─────────────────────────────────────────────────────────────────────
struct SHA1
{
    uint32_t h[5];

    SHA1() { reset(); }

    void reset()
    {
        h[0] = 0x67452301;
        h[1] = 0xEFCDAB89;
        h[2] = 0x98BADCFE;
        h[3] = 0x10325476;
        h[4] = 0xC3D2E1F0;
    }

    void process(const uint8_t *blk)
    {
        uint32_t w[80];
        for (int i = 0; i < 16; i++)
            w[i] = (blk[i * 4] << 24) | (blk[i * 4 + 1] << 16) | (blk[i * 4 + 2] << 8) | blk[i * 4 + 3];
        for (int i = 16; i < 80; i++)
        {
            uint32_t x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
            w[i] = (x << 1) | (x >> 31);
        }

        uint32_t a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];

        for (int i = 0; i < 80; i++)
        {
            uint32_t f, k;
            if (i < 20)
            {
                f = (b & c) | (~b & d);
                k = 0x5A827999;
            }
            else if (i < 40)
            {
                f = b ^ c ^ d;
                k = 0x6ED9EBA1;
            }
            else if (i < 60)
            {
                f = (b & c) | (b & d) | (c & d);
                k = 0x8F1BBCDC;
            }
            else
            {
                f = b ^ c ^ d;
                k = 0xCA62C1D6;
            }

            uint32_t t = ((a << 5) | (a >> 27)) + f + e + k + w[i];
            e = d;
            d = c;
            c = (b << 30) | (b >> 2);
            b = a;
            a = t;
        }

        h[0] += a;
        h[1] += b;
        h[2] += c;
        h[3] += d;
        h[4] += e;
    }

    std::array<uint8_t, 20> digest(const std::string &msg)
    {
        reset();

        std::vector<uint8_t> d(msg.begin(), msg.end());
        uint64_t bitlen = d.size() * 8;

        d.push_back(0x80);
        while (d.size() % 64 != 56)
            d.push_back(0x00);
        for (int i = 7; i >= 0; i--)
            d.push_back((bitlen >> (i * 8)) & 0xFF);

        for (size_t i = 0; i < d.size(); i += 64)
            process(d.data() + i);

        std::array<uint8_t, 20> result;
        for (int i = 0; i < 5; i++)
        {
            result[i * 4] = h[i] >> 24;
            result[i * 4 + 1] = h[i] >> 16;
            result[i * 4 + 2] = h[i] >> 8;
            result[i * 4 + 3] = h[i];
        }
        return result;
    }
};

// ─── Base64 ───────────────────────────────────────────────────────────────────
static std::string base64_encode(const uint8_t *data, size_t len)
{
    static const char *TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string result;
    result.reserve(((len + 2) / 3) * 4);

    int val = 0, bits = 0;
    for (size_t i = 0; i < len; i++)
    {
        val = (val << 8) | data[i];
        bits += 8;
        while (bits >= 6)
        {
            result += TABLE[(val >> (bits - 6)) & 63];
            bits -= 6;
        }
    }
    if (bits > 0)
        result += TABLE[(val << (6 - bits)) & 63];
    while (result.size() % 4)
        result += '=';

    return result;
}

// ─── WebSocket accept key ─────────────────────────────────────────────────────
static std::string make_accept_key(const std::string &key)
{
    SHA1 sha;
    auto hash = sha.digest(key + WS_MAGIC);
    return base64_encode(hash.data(), 20);
}

// ─── WebSocket opcodes ────────────────────────────────────────────────────────
enum WsOpcode : uint8_t
{
    WS_CONTINUATION = 0x00,
    WS_TEXT = 0x01,
    WS_BINARY = 0x02,
    WS_CLOSE = 0x08,
    WS_PING = 0x09,
    WS_PONG = 0x0A,
};

// ─── Frame sender ─────────────────────────────────────────────────────────────
static void wsSend(tcp::socket &sock, const std::vector<uint8_t> &data, WsOpcode opcode = WS_BINARY)
{
    try
    {

        std::vector<uint8_t> frame;
        frame.reserve(data.size() + 10);

        frame.push_back(0x80 | opcode); // FIN + opcode

        if (data.size() < 126)
        {
            frame.push_back(static_cast<uint8_t>(data.size()));
        }
        else if (data.size() <= 0xFFFF)
        {
            frame.push_back(126);
            frame.push_back((data.size() >> 8) & 0xFF);
            frame.push_back(data.size() & 0xFF);
        }
        else
        {
            frame.push_back(127);
            for (int i = 7; i >= 0; --i)
                frame.push_back((data.size() >> (i * 8)) & 0xFF);
        }

        frame.insert(frame.end(), data.begin(), data.end());
        asio::write(sock, asio::buffer(frame));
    }
    catch (const std::exception &e)
    {
        std::cerr << e.what() << '\n';
    }
}

// ─── Frame receiver ───────────────────────────────────────────────────────────
static std::vector<uint8_t> wsReceive(tcp::socket &sock)
{
    uint8_t header[2];
    asio::read(sock, asio::buffer(header, 2));

    const WsOpcode opcode = static_cast<WsOpcode>(header[0] & 0x0F);

    // handle control frames
    if (opcode == WS_CLOSE)
        throw asio::system_error(asio::error::eof, "WebSocket close frame received");

    if (opcode == WS_PING)
    {
        wsSend(sock, {}, WS_PONG);
        return wsReceive(sock); // recurse to get the next real frame
    }

    const bool masked = header[1] & 0x80;
    uint64_t len = header[1] & 0x7F;

    if (len == 126)
    {
        uint8_t ext[2];
        asio::read(sock, asio::buffer(ext, 2));
        len = (static_cast<uint64_t>(ext[0]) << 8) | ext[1];
    }
    else if (len == 127)
    {
        uint8_t ext[8];
        asio::read(sock, asio::buffer(ext, 8));
        len = 0;
        for (int i = 0; i < 8; i++)
            len = (len << 8) | ext[i];
    }

    uint8_t mask[4] = {};
    if (masked)
        asio::read(sock, asio::buffer(mask, 4));

    std::vector<uint8_t> payload(len);
    asio::read(sock, asio::buffer(payload));

    if (masked)
        for (size_t i = 0; i < len; i++)
            payload[i] ^= mask[i % 4];

    return payload;
}

// ─── Handshake ────────────────────────────────────────────────────────────────
static void establish_connection(tcp::socket &socket)
{
    asio::streambuf buf;
    asio::read_until(socket, buf, "\r\n\r\n");

    std::string req((std::istreambuf_iterator<char>(&buf)),
                    std::istreambuf_iterator<char>());

    std::string key;
    std::istringstream ss(req);
    std::string line;
    while (std::getline(ss, line))
    {
        if (line.find("Sec-WebSocket-Key:") != std::string::npos)
        {
            key = line.substr(line.find(':') + 2);
            key.erase(key.find_last_not_of(" \r\n") + 1);
            break;
        }
    }

    if (key.empty())
        throw std::runtime_error("Missing Sec-WebSocket-Key in handshake");

    const std::string response =
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Accept: " +
        make_accept_key(key) + "\r\n\r\n";

    asio::write(socket, asio::buffer(response));
}

// ─── Socket server ────────────────────────────────────────────────────────────
class Socket_Server
{
public:
    const int port = 8080;

    asio::io_context io_context;
    tcp::acceptor *acceptor;

    Socket_Server()
        : acceptor(new tcp::acceptor(io_context, tcp::endpoint(tcp::v4(), port)))
    {
        std::cout << "Socket server initialized on port: " << port << "\n";
    }

    ~Socket_Server()
    {
        delete acceptor;
    }

    tcp::acceptor *start()
    {
        return acceptor;
    }
};