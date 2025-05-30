#!/bin/bash

# Lab Journal - Stop Script
# This script stops all Lab Journal services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_color $BLUE "🧪 Lab Journal - Stopping Services"
print_color $BLUE "==================================="

# Stop services
print_color $YELLOW "🛑 Stopping Lab Journal services..."
docker-compose down

print_color $GREEN "✅ All services stopped successfully!"

# Option to remove volumes (data)
if [ "$1" = "--remove-data" ] || [ "$1" = "-d" ]; then
    print_color $YELLOW "🗑️  Removing data volumes..."
    docker-compose down -v
    print_color $RED "⚠️  All data has been removed!"
fi

# Option to remove images
if [ "$1" = "--remove-images" ] || [ "$1" = "-i" ]; then
    print_color $YELLOW "🗑️  Removing Docker images..."
    docker-compose down --rmi all
    print_color $YELLOW "✅ Docker images removed!"
fi

# Option to clean everything
if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
    print_color $YELLOW "🧹 Cleaning up everything..."
    docker-compose down -v --rmi all --remove-orphans
    docker system prune -f
    print_color $GREEN "✅ Complete cleanup finished!"
fi

print_color $BLUE "==================================="
print_color $YELLOW "🛠️  Options:"
print_color $YELLOW "   --remove-data (-d)   Remove all data"
print_color $YELLOW "   --remove-images (-i) Remove Docker images"
print_color $YELLOW "   --clean (-c)          Complete cleanup"
print_color $BLUE "==================================="