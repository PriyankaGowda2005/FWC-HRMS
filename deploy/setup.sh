#!/bin/bash

# FWC HRMS Deployment Setup Script
# This script sets up the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Docker
    if ! command -v Docker &> /dev/null; then
        print_error "Docker is required but not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is required but not installed"
        exit 1
    fi

    print_success "All dependencies are installed"
}

# Create production environment file
create_production_env() {
    print_status "Setting up production environment..."
    
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production

# Database
DATABASE_URL="mongodb://app_user:\${DB_PASSWORD}@mongodb:27017/fwc_hrms"

# Database Credentials (set these securely)
DB_USERNAME=app_user
DB_PASSWORD=\${DB_PASSWORD}
DB_NAME=fwc_hrms

# JWT Configuration
JWT_SECRET=\${JWT_SECRET}
JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# ML Service
ML_SERVICE_URL=https://your-ml-service-domain.com

# Redis (for BullMQ)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=\${REDIS_PASSWORD}

# SMTP Configuration
SMTP_HOST=\${SMTP_HOST}
SMTP_PORT=\${SMTP_PORT}
SMTP_USER=\${SMTP_USER}
SMTP_PASS=\${SMTP_PASS}
SMTP_FROM=\${SMTP_FROM}

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
EOF

    print_success "Production environment file created"
    print_warning "Please update .env.production with your actual values"
}

# Create production Docker Compose file
create_production_compose() {
    print_status "Creating production Docker Compose configuration..."
    
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: fwc-hrms-mongodb-prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: fwc_hrms
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - hrms-network
    command: mongod --auth

  redis:
    image: redis:7-alpine
    container_name: fwc-hrms-redis-prod
    restart: unless-stopped
    command: redis-server --requirepass \${REDIS_PASSWORD}
    networks:
      - hrms-network

  backend:
    build: 
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: fwc-hrms-backend-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
      - redis
    networks:
      - hrms-network
    volumes:
      - uploads_data:/app/uploads

  frontend:
    build: 
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: fwc-hrms-frontend-prod
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - hrms-network

  ml-service:
    build: ./services/ml
    container_name: fwc-hrms-ml-prod
    restart: unless-stopped
    environment:
      - PYTHONUNBUFFERED=1
    networks:
      - hrms-network

networks:
  hrms-network:
    driver: bridge

volumes:
  mongodb_data:
  uploads_data:
EOF

    print_success "Production Docker Compose file created"
}

# Create production nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    mkdir -p nginx
    
    cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server fwc-hrms-backend-prod:3001;
    }
    
    upstream frontend {
        server fwc-hrms-frontend-prod:80;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        # API routes
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # ML service routes
        location /ml {
            proxy_pass http://fwc-hrms-ml-prod:8000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

    print_success "Nginx configuration created"
}

# Create deployment script
create_deployment_script() {
    print_status "Creating deployment script..."
    
    cat > deploy.sh << 'EOF'
#!/bin/bash

# Production deployment script
set -e

echo "🚀 Deploying FWC HRMS to production..."

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push

# Create admin user
echo "👤 Creating admin user..."
docker-compose -fusion docker-compose.prod.yml exec backend node -e "
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@fwchrmc.com' }
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      const user = await prisma.user.create({
        data: {
          email: 'admin@fwchrmc.com',
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      await prisma.employee.create({
        data: {
          userId: user.id,
          firstName: 'Admin',
          lastName: 'User',
          department: 'IT',
          position: 'System Administrator',
          hireDate: new Date()
        }
      });
      
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();
"

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "Frontend: http://your-domain.com"
echo "Backend API: http://your-domain.com/api"
echo "ML Service: http://your-domain.com/ml"
echo ""
echo "🔐 Admin Credentials:"
echo "Email: admin@fwchrmc.com"
echo "Password: admin123"
EOF

    chmod +x deploy.sh
    print_success "Deployment script created"
}

# Generate SSL certificates (using Let's Encrypt example)
setup_ssl() {
    print_status "Setting up SSL configuration..."
    
    cat > ssl/setup.sh << 'EOF'
#!/bin/bash

# SSL Setup Script using Certbot

# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com -d ml.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
EOF

    mkdir -p ssl
    chmod +x ssl/setup.sh
    print_success "SSL setup script created"
}

# Main execution
main() {
    echo "🏗️ Setting up FWC HRMS Production Environment"
    echo "=============================================="
    
    check_dependencies
    create_production_env
    create_production_compose
    create_nginx_config
    create_deployment_script
    setup_ssl
    
    print_success "Production setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.production with your actual values"
    echo "2. Update nginx/nginx.conf with your domain"
    echo "3. Run ./deploy.sh to deploy"
}

main "$@"
