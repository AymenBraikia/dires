cmake_minimum_required(VERSION 3.15)

# Name your project
project(GameBackend LANGUAGES CXX)

# Use C++17 or higher
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 1. Find the packages you installed via vcpkg
find_package(asio CONFIG REQUIRED)
find_package(fmt CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)

# 2. Add your source files
# If you have more .cpp files, add them here
add_executable(GameBackend src/main.cpp)

# 3. Link the libraries to your executable
# This automatically handles include paths AND .lib/.a files
target_include_directories(GameBackend PRIVATE 
    C:/Users/HP/Desktop/backend/vcpkg_installed/x64-windows/include
)

target_link_libraries(GameBackend PRIVATE 
    asio::asio
    fmt::fmt
    nlohmann_json::nlohmann_json
    ws2_32
    wsock32
)