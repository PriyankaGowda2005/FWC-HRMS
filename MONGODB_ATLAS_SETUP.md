# MongoDB Atlas Setup Guide for FWC HRMS

This guide will help you set up MongoDB Atlas for your FWC HRMS deployment on Render.

## Prerequisites

1. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Credit Card**: Required for Atlas account (free tier available)

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Start Free"
3. Fill in your account details
4. Verify your email address

### 2. Create a New Cluster

1. **Choose Cloud Provider**:

   - Select AWS, Google Cloud, or Azure
   - Choose the region closest to your Render services

2. **Select Cluster Tier**:

   - **M0 Sandbox (Free)**: 512 MB storage, shared RAM
   - **M2/M5 (Paid)**: Better performance for production

3. **Cluster Name**:

   - Use: `fwc-hrms-cluster` or similar

4. **Click "Create Cluster"**

### 3. Configure Database Access

1. **Create Database User**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - **Authentication Method**: Password
   - **Username**: `fwc_user` (or your preferred name)
   - **Password**: Generate a secure password (save this!)
   - **Database User Privileges**: Read and write to any database
   - Click "Add User"

### 4. Configure Network Access

1. **Whitelist IP Addresses**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - **Option 1**: Add `0.0.0.0/0` (allows access from anywhere - for development)
   - **Option 2**: Add specific Render IP ranges (more secure for production)
   - Click "Confirm"

### 5. Get Connection String

1. **Connect to Cluster**:

   - Go to "Clusters" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - **Driver**: Node.js
   - **Version**: 4.1 or later
   - Copy the connection string

2. **Connection String Format**:
   ```
   mongodb+srv://fwc_user:<password>@fwc-hrms-cluster.xxxxx.mongodb.net/fwc_hrms?retryWrites=true&w=majority
   ```

### 6. Update Environment Variables

Replace the connection string in your Render environment variables:

```
DATABASE_URL=mongodb+srv://fwc_user:YOUR_PASSWORD@fwc-hrms-cluster.xxxxx.mongodb.net/fwc_hrms?retryWrites=true&w=majority
```

## Security Best Practices

### 1. Database User Security

- Use strong, unique passwords
- Create separate users for different environments
- Regularly rotate passwords
- Use least privilege principle

### 2. Network Security

- **Development**: Use `0.0.0.0/0` for easy access
- **Production**: Whitelist only Render IP ranges
- Monitor access logs regularly

### 3. Connection Security

- Always use SSL/TLS (enabled by default)
- Use connection string with `retryWrites=true&w=majority`
- Enable authentication

## Testing Your Connection

### 1. Test from Render Dashboard

1. Go to your backend service on Render
2. Check the logs for database connection messages
3. Look for successful connection or error messages

### 2. Test with MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Use your connection string to connect
3. Verify you can see the `fwc_hrms` database

### 3. Test via API

Once deployed, test the health endpoint:

```bash
curl https://your-backend-url.onrender.com/health
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**:

   - Check network access settings
   - Verify IP whitelist includes Render
   - Check firewall settings

2. **Authentication Failed**:

   - Verify username and password
   - Check database user privileges
   - Ensure user has read/write access

3. **SSL/TLS Issues**:
   - Ensure connection string includes SSL parameters
   - Check certificate validity
   - Use `retryWrites=true&w=majority` parameters

### Debug Steps

1. **Check Atlas Logs**:

   - Go to Atlas dashboard
   - Check "Logs" section for connection attempts
   - Look for error messages

2. **Test Connection String**:

   - Use MongoDB Compass to test
   - Try connecting from different networks
   - Verify all parameters are correct

3. **Render Logs**:
   - Check Render service logs
   - Look for database connection errors
   - Verify environment variables are set

## Production Considerations

### 1. Cluster Scaling

- **M0**: Good for development/testing
- **M2/M5**: Better for production workloads
- **M10+**: For high-traffic applications

### 2. Backup Strategy

- Enable automatic backups
- Set up point-in-time recovery
- Test restore procedures regularly

### 3. Monitoring

- Set up Atlas monitoring alerts
- Monitor connection counts
- Track query performance

### 4. Security

- Enable audit logging
- Use IP whitelisting
- Regular security reviews
- Rotate credentials regularly

## Cost Optimization

### Free Tier (M0)

- **Storage**: 512 MB
- **RAM**: Shared
- **Connections**: 100 concurrent
- **Good for**: Development, testing, small applications

### Paid Tiers

- **M2**: $9/month - 2 GB storage, 0.5 GB RAM
- **M5**: $25/month - 5 GB storage, 1 GB RAM
- **M10**: $57/month - 10 GB storage, 2 GB RAM

## Support Resources

- **MongoDB Atlas Documentation**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **MongoDB Community**: [community.mongodb.com](https://community.mongodb.com)
- **Atlas Support**: Available through Atlas dashboard

## Next Steps

After setting up MongoDB Atlas:

1. Update your Render environment variables
2. Deploy your services to Render
3. Test the database connection
4. Initialize your database with sample data
5. Monitor performance and usage

For more information, see the main [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md).
