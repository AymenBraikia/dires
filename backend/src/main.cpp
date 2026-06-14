#include <iostream>
#include <sstream>
#include <string>
#include <array>

#include <asio.hpp>
#include "../include/socket_utils.h"

#include "../include/server.h"
#include "../include/entities/player.h"
#include "../include/packets.h"

using std::cout;
using std::vector;

int tps = 60;

Server *setup_server(Socket_Server *ws)
{
    return new Server(ws->start(), tps);
}

void listen_for_connections(Socket_Server *ws, Server *server)
{
    for (;;)
    {
        try
        {
            tcp::socket socket(ws->io_context);
            ws->acceptor->accept(socket);
            establish_connection(socket);

            Player *player = server->spawn_player(std::move(socket), 2e3, 8e3);

            std::thread([player]()
                        {
    try {
        player->socket_handler();
    } catch (const std::exception& e) {
        // Log the error or handle it gracefully
        std::cerr << "Exception in socket_handler: " << e.what() << std::endl;
    } catch (...) {
        // Catch-all for non-standard exceptions
        std::cerr << "An unknown error occurred in socket_handler." << std::endl;
    } })
                .detach();
        }
        catch (std::exception &e)
        {
            // one connection failed, but server keeps running
            std::cout << "Connection error: " << e.what() << "\n";
        }
    }
}
int main()
{
    cout << "Starting server... \n";
    Socket_Server ws;
    Server *server = setup_server(&ws);

    std::thread(&Server::loop, server).detach(); // game loop runs in a separate thread

    listen_for_connections(&ws, server);

    delete server; // cleanup (optional if process exits)
    return 0;
}
