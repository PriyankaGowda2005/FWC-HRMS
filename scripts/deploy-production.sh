#!/bin/bash

# Production Deployment Script for SmartHire System
# This script sets up the complete system for production deployment

echo "🚀 Starting SmartHire Production Deployment..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_status "WARNING" "Running as root. Consider using a non-root user for production."
fi

# Step 1: Install system dependencies
print_status "INFO" "Installing system dependencies..."

# Update package manager
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip nodejs npm redis-server mongodb git curl
elif command -v yum &> /dev/null; then
    sudo yum update -y
    sudo yum install -y python3 python3-pip nodejs npm redis mongodb-server git curl
elif command -v brew &> /dev/null; then
    brew update
    brew install python3 node redis mongodb git curl
else
    print_status "ERROR" "Unsupported package manager. Please install dependencies manually."
    exit 1
fi

print_status "SUCCESS" "System dependencies installed"

# Step 2: Install Python dependencies
print_status "INFO" "Installing Python dependencies..."

cd services/ml
pip3 install -r requirements.txt
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Python dependencies installed"
else
    print_status "ERROR" "Failed to install Python dependencies"
    exit 1
fi
cd ../..

# Step 3: Install Node.js dependencies
print_status "INFO" "Installing Node.js dependencies..."

# Backend dependencies
cd apps/backend
npm install --production
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Backend dependencies installed"
else
    print_status "ERROR" "Failed to install backend dependencies"
    exit 1
fi
cd ../..

# Frontend dependencies
cd apps/frontend
npm install --production
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Frontend dependencies installed"
else
    print_status "ERROR" "Failed to install frontend dependencies"
    exit 1
fi
cd ../..

# Step 4: Set up environment files
print_status "INFO" "Setting up environment files..."

# Create backend .env file
cat > apps/backend/.env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001
DATABASE_URL=mongodb://localhost:27017/HRMS
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
LOG_LEVEL=info
EOF

# Create ML service .env file
cat > services/ml/.env << EOF
# Production Environment Configuration
REDIS_URL=redis://localhost:6379/0
MODEL_PATH=./models/
UPLOAD_PATH=./uploads/
TEMP_PATH=./temp/
MONGODB_URI=mongodb://localhost:27017/smarthire
JWT_SECRET=$(openssl rand -base64 32)
API_KEY=$(openssl rand -base64 32)
LOG_LEVEL=info
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=30
BATCH_SIZE=32
MAX_FILE_SIZE=10485760
CLEANUP_INTERVAL=3600
EOF

print_status "SUCCESS" "Environment files created"

# Step 5: Create necessary directories
print_status "INFO" "Creating necessary directories..."

mkdir -p apps/backend/uploads
mkdir -p apps/backend/logs
mkdir -p services/ml/models
mkdir -p services/ml/uploads
mkdir -p services/ml/temp
mkdir -p services/ml/logs
mkdir -p services/interview_realtime/logs

print_status "SUCCESS" "Directories created"

# Step 6: Set up database
print_status "INFO" "Setting up database..."

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Wait for services to start
sleep 5

# Initialize database
cd apps/backend
node src/scripts/init-db.js
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Database initialized"
else
    print_status "WARNING" "Database initialization failed, but continuing..."
fi
cd ../..

# Step 7: Build frontend for production
print_status "INFO" "Building frontend for production..."

cd apps/frontend
npm run build
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Frontend built for production"
else
    print_status "ERROR" "Failed to build frontend"
    exit 1
fi
cd ../..

# Step 8: Create systemd services
print_status "INFO" "Creating systemd services..."

# Backend service
sudo tee /etc/systemd/system/smarthire-backend.service > /dev/null << EOF
[Unit]
Description=SmartHire Backend Service
After=network.target mongod.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)/apps/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/apps/backend/.env

[Install]
WantedBy=multi-user.target
EOF

# ML service
sudo tee /etc/systemd/system/smarthire-ml.service > /dev/null << EOF
[Unit]
Description=SmartHire ML Service
After=network.target mongod.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)/services/ml
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10
EnvironmentFile=$(pwd)/services/ml/.env

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (using nginx)
sudo tee /etc/systemd/system/smarthire-frontend.service > /dev/null << EOF
[Unit]
Description=SmartHire Frontend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)/apps/frontend
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 5173
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

print_status "SUCCESS" "Systemd services created"

# Step 9: Set up nginx reverse proxy
print_status "INFO" "Setting up nginx reverse proxy..."

sudo tee /etc/nginx/sites-available/smarthire > /dev/null << EOF
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ML Service API
    location /ml/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/smarthire /etc/nginx/sites-enabled/
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    print_status "SUCCESS" "Nginx reverse proxy configured"
else
    print_status "ERROR" "Nginx configuration failed"
    exit 1
fi

# Step 10: Start services
print_status "INFO" "Starting services..."

sudo systemctl start smarthire-backend
sudo systemctl start smarthire-ml
sudo systemctl start smarthire-frontend

sudo systemctl enable smarthire-backend
sudo systemctl enable smarthire-ml
sudo systemctl enable smarthire-frontend

print_status "SUCCESS" "Services started"

# Step 11: Run health checks
print_status "INFO" "Running health checks..."

sleep 10

# Check backend
curl -s http://localhost:3001/api/health > /dev/null
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Backend service is healthy"
else
    print_status "ERROR" "Backend service is not responding"
fi

# Check ML service
curl -s http://localhost:8000/health > /dev/null
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "ML service is healthy"
else
    print_status "ERROR" "ML service is not responding"
fi

# Check frontend
curl -s http://localhost:5173 > /dev/null
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Frontend service is healthy"
else
    print_status "ERROR" "Frontend service is not responding"
fi

# Step 12: Create monitoring script
print_status "INFO" "Creating monitoring script..."

cat > monitor-services.sh << 'EOF'
#!/bin/bash

echo "🔍 SmartHire Service Monitor"
echo "=========================="

# Check services
echo "Backend Service:"
sudo systemctl status smarthire-backend --no-pager -l

echo -e "\nML Service:"
sudo systemctl status smarthire-ml --no-pager -l

echo -e "\nFrontend Service:"
sudo systemctl status smarthire-frontend --no-pager -l

echo -e "\nDatabase Services:"
sudo systemctl status mongod --no-pager -l
sudo systemctl status redis --no-pager -l

echo -e "\nNginx:"
sudo systemctl status nginx --no-pager -l

echo -e "\nService URLs:"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "ML Service: http://localhost/ml"
echo "API Docs: http://localhost/ml/docs"
EOF

chmod +x monitor-services.sh

print_status "SUCCESS" "Monitoring script created"

# Final summary
echo ""
echo "=============================================="
echo "🎉 SmartHire Production Deployment Complete!"
echo "=============================================="

echo ""
echo "📊 Service Status:"
sudo systemctl status smarthire-backend --no-pager -l | head -3
sudo systemctl status smarthire-ml --no-pager -l | head -3
sudo systemctl status smarthire-frontend --no-pager -l | head -3

echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "ML Service: http://localhost/ml"
echo "API Documentation: http://localhost/ml/docs"

echo ""
echo "🔧 Management Commands:"
echo "Start services: sudo systemctl start smarthire-{backend,ml,frontend}"
echo "Stop services: sudo systemctl stop smarthire-{backend,ml,frontend}"
echo "Restart services: sudo systemctl restart smarthire-{backend,ml,frontend}"
echo "View logs: sudo journalctl -u smarthire-{backend,ml,frontend} -f"
echo "Monitor services: ./monitor-services.sh"

echo ""
echo "📝 Next Steps:"
echo "1. Configure SSL certificates for HTTPS"
echo "2. Set up backup procedures"
echo "3. Configure monitoring and alerting"
echo "4. Set up log rotation"
echo "5. Configure firewall rules"

echo ""
echo "🔒 Security Notes:"
echo "- Change default JWT secrets in .env files"
echo "- Configure firewall to restrict access"
echo "- Set up SSL certificates"
echo "- Regular security updates"

print_status "SUCCESS" "Production deployment completed successfully!"
