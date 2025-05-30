# 🧪 Lab Journal - Electronic Laboratory Management System

A comprehensive web-based electronic lab journal with chemical inventory management, experiment tracking, user management, and administrative capabilities.

## 🚀 Quick Start with Docker

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### One-Command Setup

```bash
# Clone or download the project
git clone <your-repo-url>
cd lab-journal

# Make scripts executable
chmod +x start.sh stop.sh

# Start the application
./start.sh
```

That's it! The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Documentation:** http://localhost:8001/docs

### Default Login
- **Email:** `admin@lab.com`
- **Password:** `admin123`

## 🛠️ Management Commands

### Start the Application
```bash
# Production mode (default)
./start.sh

# Development mode (with hot reload)
./start.sh dev
```

### Stop the Application
```bash
# Stop services
./stop.sh

# Stop and remove all data
./stop.sh --remove-data

# Complete cleanup (removes images and data)
./stop.sh --clean
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Service Status
```bash
docker-compose ps
```

## 📋 Features

### 🔐 User Management
- JWT-based authentication
- Role-based access control (Admin, Researcher, Student, Guest)
- Custom role creation with granular permissions
- User lifecycle management

### 🧪 Chemical Inventory
- Comprehensive chemical tracking
- Low stock alerts and expiration monitoring
- Advanced search and filtering
- Safety data management
- Multiple unit types (weight, volume, amount)

### 🔬 Experiment Journal
- Detailed experiment documentation
- Chemical and equipment linking
- Procedure recording
- Results and conclusions tracking
- Date-based organization

### 🏛️ Admin Panel
- Unified administrative interface
- Activity logging and audit trail
- System statistics and analytics
- Role and permission management

### 📊 Dashboard & Analytics
- Real-time inventory statistics
- Experiment tracking
- User activity monitoring
- Visual indicators and alerts

## 🏗️ Architecture

### Services
- **Frontend:** React with Tailwind CSS (Port 3000)
- **Backend:** FastAPI with Python (Port 8001)
- **Database:** MongoDB (Port 27017)

### Docker Containers
- `lab-journal-frontend` - React application
- `lab-journal-backend` - FastAPI server
- `lab-journal-mongodb` - MongoDB database

## 🔧 Development

### Development Mode
```bash
# Start with hot reload
./start.sh dev

# This enables:
# - Backend auto-reload on code changes
# - Frontend hot-reload
# - Debug logging
# - Development database
```

### File Structure
```
lab-journal/
├── backend/                 # FastAPI backend
│   ├── server.py           # Main application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   └── .env              # Environment variables
├── docker-compose.yml     # Production configuration
├── docker-compose.dev.yml # Development overrides
├── start.sh              # Start script
├── stop.sh               # Stop script
└── README.md             # This file
```

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Database
MONGO_URL=mongodb://mongodb:27017
DB_NAME=lab_journal

# Security
JWT_SECRET=your-secret-key

# Frontend
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Activity logging and audit trail
- Input validation and sanitization
- CORS protection
- Security headers

## 📱 Usage

### Getting Started
1. Start the application with `./start.sh`
2. Open http://localhost:3000
3. Login with admin credentials
4. Explore the features:
   - Add chemicals to inventory
   - Create experiments
   - Manage users and roles
   - View activity logs

### User Roles
- **Admin:** Full system access
- **Researcher:** Chemical and experiment management
- **Student:** Limited chemical and experiment access
- **Guest:** Read-only access

### Admin Panel
Access via the "Admin Panel" tab (admin users only):
- **Overview:** System statistics
- **User Management:** Create and manage users
- **Role Management:** Custom roles and permissions
- **Activity Log:** Audit trail with detailed logging

## 🔄 Data Persistence

All data is persisted in Docker volumes:
- **Database:** `mongodb_data` volume
- **Development:** Separate `mongodb_dev_data` volume

## 🚨 Troubleshooting

### Port Conflicts
If ports are in use:
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8001
lsof -i :27017

# Kill processes if needed
sudo kill -9 <PID>
```

### Service Issues
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>
```

### Reset Everything
```bash
# Complete reset with data removal
./stop.sh --clean
./start.sh
```

## 🎯 Production Deployment

For production deployment:

1. **Update environment variables:**
   - Change JWT_SECRET to a secure random string
   - Use production MongoDB connection string
   - Set DEBUG=false

2. **Use production compose:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Set up reverse proxy (nginx/Apache)**
4. **Configure SSL/TLS certificates**
5. **Set up monitoring and logging**

## 📈 Monitoring

### Health Checks
All services include health checks:
```bash
# Check health status
docker-compose ps
```

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test with `./start.sh dev`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. View logs with `docker-compose logs`
3. Create an issue in the repository

---

**Happy Lab Management! 🧪✨**