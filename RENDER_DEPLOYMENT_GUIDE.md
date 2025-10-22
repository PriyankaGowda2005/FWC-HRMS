# Render Deployment Guide for FWC HRMS

This guide will help you deploy the FWC HRMS backend and ML services to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster
4. **API Keys**: Gather required API keys (OpenAI, Resend, etc.)

## Deployment Steps

### 1. Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist Render's IP addresses (0.0.0.0/0 for development)
5. Get your connection string

### 2. Backend Service Deployment

1. **Connect Repository**:

   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the FWC-HRMS repository

2. **Configure Backend Service**:

   ```
   Name: fwc-hrms-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: apps/backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables**:

   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/fwc_hrms
   JWT_SECRET=<generate-secure-random-string>
   JWT_REFRESH_SECRET=<generate-secure-random-string>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   FRONTEND_URL=https://fwc-hrms-frontend.onrender.com
   ML_SERVICE_URL=https://fwc-hrms-ml.onrender.com
   RESEND_API_KEY=<your-resend-api-key>
   RESEND_FROM=FWC HRMS <noreply@fwchrms.com>
   REDIS_URL=<render-redis-connection-string>
   ```

4. **Advanced Settings**:
   - Health Check Path: `/health`
   - Auto-Deploy: Yes
   - Plan: Starter (free tier)

### 3. ML Service Deployment

1. **Create ML Service**:

   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect the same GitHub repository

2. **Configure ML Service**:

   ```
   Name: fwc-hrms-ml
   Environment: Python 3
   Region: Same as backend
   Branch: main
   Root Directory: services/ml
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**:

   ```
   PYTHON_VERSION=3.11.0
   PORT=8000
   DATABASE_URL=<same-as-backend>
   REDIS_URL=<same-as-backend>
   OPENAI_API_KEY=<your-openai-api-key>
   ```

4. **Advanced Settings**:
   - Health Check Path: `/health`
   - Auto-Deploy: Yes
   - Plan: Starter (free tier)

### 4. Redis Service (Optional but Recommended)

1. **Create Redis Service**:

   - Go to Render Dashboard
   - Click "New +" → "Redis"
   - Configure:
     ```
     Name: fwc-hrms-redis
     Plan: Starter
     Region: Same as other services
     ```

2. **Update Environment Variables**:
   - Copy the Redis connection string
   - Add `REDIS_URL` to both backend and ML services

### 5. Frontend Service (Optional)

If you want to deploy the frontend as well:

1. **Create Frontend Service**:

   ```
   Name: fwc-hrms-frontend
   Environment: Static Site
   Root Directory: apps/frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

2. **Environment Variables**:
   ```
   VITE_API_URL=https://fwc-hrms-backend.onrender.com/api
   VITE_SOCKET_URL=https://fwc-hrms-backend.onrender.com
   VITE_ML_SERVICE_URL=https://fwc-hrms-ml.onrender.com
   ```

## Using render.yaml (Alternative Method)

Instead of manual configuration, you can use the provided `render.yaml` file:

1. **Push render.yaml** to your repository root
2. **Go to Render Dashboard**
3. **Click "New +" → "Blueprint"**
4. **Connect your repository**
5. **Render will automatically create all services**

## Environment Variables Reference

### Required Variables

| Variable             | Description               | Example                                          |
| -------------------- | ------------------------- | ------------------------------------------------ |
| `DATABASE_URL`       | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET`         | JWT signing secret        | Generate random string                           |
| `JWT_REFRESH_SECRET` | JWT refresh secret        | Generate random string                           |
| `REDIS_URL`          | Redis connection string   | `redis://user:pass@host:port`                    |

### Optional Variables

| Variable         | Description           | Default                       |
| ---------------- | --------------------- | ----------------------------- |
| `NODE_ENV`       | Environment mode      | `production`                  |
| `PORT`           | Server port           | `3001` (backend), `8000` (ML) |
| `FRONTEND_URL`   | Frontend URL for CORS | `http://localhost:5173`       |
| `ML_SERVICE_URL` | ML service URL        | `http://localhost:8000`       |
| `RESEND_API_KEY` | Email service API key | -                             |
| `OPENAI_API_KEY` | OpenAI API key        | -                             |

## Post-Deployment Configuration

### 1. Database Initialization

After deployment, initialize your database:

```bash
# Connect to your backend service
curl -X POST https://fwc-hrms-backend.onrender.com/api/db/init
```

### 2. Health Checks

Verify all services are running:

```bash
# Backend health check
curl https://fwc-hrms-backend.onrender.com/health

# ML service health check
curl https://fwc-hrms-ml.onrender.com/health
```

### 3. CORS Configuration

Update CORS settings in your backend to allow your frontend domain.

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify build commands are correct

2. **Database Connection Issues**:

   - Verify MongoDB Atlas cluster is running
   - Check connection string format
   - Ensure IP whitelist includes Render

3. **Environment Variable Issues**:

   - Double-check variable names (case-sensitive)
   - Ensure all required variables are set
   - Verify API keys are valid

4. **Service Communication Issues**:
   - Check service URLs in environment variables
   - Verify CORS configuration
   - Test API endpoints individually

### Debugging Tips

1. **Check Logs**:

   - Use Render's log viewer
   - Add console.log statements for debugging
   - Monitor error patterns

2. **Test Locally**:

   - Use production environment variables locally
   - Test with same Node.js/Python versions
   - Verify all dependencies work

3. **Monitor Performance**:
   - Use Render's metrics dashboard
   - Monitor memory and CPU usage
   - Set up alerts for service downtime

## Scaling and Optimization

### Performance Optimization

1. **Enable Caching**:

   - Use Redis for session storage
   - Implement API response caching
   - Cache static assets

2. **Database Optimization**:

   - Add database indexes
   - Use connection pooling
   - Optimize queries

3. **Service Optimization**:
   - Enable gzip compression
   - Use CDN for static assets
   - Implement request rate limiting

### Scaling Options

1. **Upgrade Plans**:

   - Move to paid plans for better performance
   - Increase memory and CPU limits
   - Enable auto-scaling

2. **Service Separation**:
   - Deploy services in different regions
   - Use load balancers
   - Implement microservices architecture

## Security Considerations

1. **Environment Variables**:

   - Never commit secrets to repository
   - Use Render's secure environment variables
   - Rotate API keys regularly

2. **Database Security**:

   - Use strong passwords
   - Enable MongoDB Atlas security features
   - Restrict IP access

3. **API Security**:
   - Implement rate limiting
   - Use HTTPS everywhere
   - Validate all inputs

## Monitoring and Maintenance

1. **Set Up Monitoring**:

   - Use Render's built-in monitoring
   - Set up uptime monitoring
   - Monitor error rates

2. **Regular Maintenance**:

   - Update dependencies regularly
   - Monitor security advisories
   - Backup database regularly

3. **Log Management**:
   - Set up log aggregation
   - Monitor error patterns
   - Implement alerting

## Support and Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Project Repository**: [GitHub Repository](https://github.com/PriyankaGowda2005/FWC-HRMS)

For additional support, check the project's README or open an issue on GitHub.
