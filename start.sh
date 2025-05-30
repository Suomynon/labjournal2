#!/bin/bash

# Lab Journal - Easy Start Script
# This script makes it super easy to start the lab journal

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

print_color $BLUE "🧪 Lab Journal - Docker Setup"
print_color $BLUE "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_color $RED "❌ Docker is not installed. Please install Docker first."
    print_color $YELLOW "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_color $RED "❌ Docker Compose is not installed. Please install Docker Compose first."
    print_color $YELLOW "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Function to check if port is available
check_port() {
    port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_color $RED "❌ Port $port is already in use. Please stop the service using this port."
        return 1
    fi
    return 0
}

# Check if required ports are available
print_color $YELLOW "🔍 Checking port availability..."
check_port 3000 || exit 1
check_port 8001 || exit 1
check_port 27017 || exit 1

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_color $YELLOW "📝 Creating .env file..."
    cp .env.example .env
    print_color $GREEN "✅ Created .env file from template"
fi

# Determine mode (development or production)
MODE=${1:-production}

if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
    print_color $YELLOW "🔧 Starting in DEVELOPMENT mode..."
    COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
else
    print_color $YELLOW "🚀 Starting in PRODUCTION mode..."
    COMPOSE_FILE="docker-compose.yml"
fi

# Build and start services
print_color $YELLOW "🐳 Building Docker images..."
docker-compose -f $COMPOSE_FILE build

print_color $YELLOW "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
print_color $YELLOW "⏳ Waiting for services to start..."
sleep 10

# Check service health
check_service_health() {
    service=$1
    port=$2
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port > /dev/null 2>&1; then
            print_color $GREEN "✅ $service is running!"
            return 0
        fi
        print_color $YELLOW "⏳ Waiting for $service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_color $RED "❌ $service failed to start"
    return 1
}

# Check backend health
if check_service_health "Backend API" 8001; then
    print_color $GREEN "✅ Backend API is healthy"
else
    print_color $RED "❌ Backend API failed to start"
    docker-compose -f $COMPOSE_FILE logs backend
    exit 1
fi

# Check frontend health
if check_service_health "Frontend" 3000; then
    print_color $GREEN "✅ Frontend is healthy"
else
    print_color $RED "❌ Frontend failed to start"
    docker-compose -f $COMPOSE_FILE logs frontend
    exit 1
fi

print_color $GREEN "🎉 Lab Journal is now running!"
print_color $BLUE "================================"
print_color $GREEN "📱 Frontend: http://localhost:3000"
print_color $GREEN "🔧 Backend API: http://localhost:8001"
print_color $GREEN "📚 API Docs: http://localhost:8001/docs"
print_color $BLUE "================================"
print_color $YELLOW "🔐 Default Admin Login:"
print_color $YELLOW "   Email: admin@lab.com"
print_color $YELLOW "   Password: admin123"
print_color $BLUE "================================"
print_color $YELLOW "🛠️  Useful Commands:"
print_color $YELLOW "   Stop:    ./stop.sh"
print_color $YELLOW "   Logs:    docker-compose logs -f"
print_color $YELLOW "   Status:  docker-compose ps"
print_color $BLUE "================================"

# Auto-open browser (optional)
if command -v open &> /dev/null; then
    print_color $YELLOW "🌐 Opening browser..."
    sleep 3
    open http://localhost:3000
fi