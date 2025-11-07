#!/usr/bin/env node

/**
 * Backend Server Startup Script
 * This script helps verify the server can start properly
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3001;
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

console.log('🚀 Starting Backend Server...\n');

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// Wait for server to be ready
function waitForServer(port, retries = 0) {
  return new Promise((resolve, reject) => {
    if (retries >= MAX_RETRIES) {
      reject(new Error('Server failed to start after maximum retries'));
      return;
    }

    const req = http.get(`http://localhost:${port}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend server is ready!');
        resolve();
      } else {
        setTimeout(() => waitForServer(port, retries + 1), RETRY_DELAY);
      }
    });

    req.on('error', () => {
      console.log(`⏳ Waiting for server... (${retries + 1}/${MAX_RETRIES})`);
      setTimeout(() => waitForServer(port, retries + 1), RETRY_DELAY);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      setTimeout(() => waitForServer(port, retries + 1), RETRY_DELAY);
    });
  });
}

async function startServer() {
  try {
    // Check if port is available
    const portAvailable = await checkPort(PORT);
    if (!portAvailable) {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.log(`💡 Try one of these:`);
      console.log(`   - Kill the process using port ${PORT}`);
      console.log(`   - Use a different port: PORT=3002 npm start`);
      process.exit(1);
    }

    // Start the server
    const serverPath = path.join(__dirname, 'src', 'server.js');
    const serverProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT }
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if server is ready
    try {
      await waitForServer(PORT);
      console.log(`\n✅ Server is running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
      console.log(`👥 Candidates endpoint: http://localhost:${PORT}/api/candidates/login\n`);
    } catch (error) {
      console.error('⚠️  Server may still be starting...');
      console.log('💡 Check the logs above for any errors\n');
    }

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill();
      process.exit(0);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

