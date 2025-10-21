import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        
        this.socket = io(backendUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          autoConnect: true
        });

        this.socket.on('connect', () => {
          console.log('🔌 Socket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connected', (data) => {
          console.log('🔌 Socket authenticated:', data);
          this.emit('socket:connected', data);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          this.isConnected = false;
          this.emit('socket:disconnected', { reason });
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔌 Socket connection error:', error);
          this.isConnected = false;
          this.emit('socket:error', { error: error.message });
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnect();
          } else {
            reject(error);
          }
        });

        // Handle dashboard data updates
        this.socket.on('dashboard_data', (data) => {
          this.emit('dashboard:data', data);
        });

        // Handle leave updates
        this.socket.on('leave_decision', (data) => {
          this.emit('leave:decision', data);
        });

        this.socket.on('leave_approved', (data) => {
          this.emit('leave:approved', data);
        });

        this.socket.on('leave_updated', (data) => {
          this.emit('leave:updated', data);
        });

        // Handle performance review updates
        this.socket.on('performance_review_created', (data) => {
          this.emit('performance:review_created', data);
        });

        // Handle team analytics
        this.socket.on('team_analytics', (data) => {
          this.emit('analytics:team', data);
        });

        // Handle attendance updates
        this.socket.on('attendance:clocked', (data) => {
          this.emit('attendance:clocked', data);
        });

        // Handle notifications
        this.socket.on('notification', (data) => {
          this.emit('notification', data);
        });

        // Handle errors
        this.socket.on('error', (data) => {
          this.emit('socket:error', data);
        });

      } catch (error) {
        console.error('🔌 Socket initialization error:', error);
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      this.emit('socket:max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔌 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Dashboard methods
  requestDashboardData(timeRange = 'week', managerId = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_dashboard_data', { timeRange, managerId });
    }
  }

  requestTeamAnalytics(timeRange = 'month', managerId = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_team_analytics', { timeRange, managerId });
    }
  }

  // Leave management methods
  approveLeave(leaveId, action, rejectionReason = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('approve_leave', { leaveId, action, rejectionReason });
    }
  }

  // Performance review methods
  createPerformanceReview(employeeId, reviewData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('create_performance_review', { employeeId, reviewData });
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;