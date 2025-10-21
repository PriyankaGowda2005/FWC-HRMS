const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userRoles = new Map(); // userId -> role
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:3000',
          'http://localhost:5175'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('🔌 Socket.IO server initialized');
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get user role from database - convert userId to ObjectId
      const user = await database.findOne('users', { _id: new ObjectId(decoded.userId) });
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.userRole = user.role;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  handleConnection(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    console.log(`🔌 User ${userId} (${userRole}) connected`);

    // Store user connection info
    this.connectedUsers.set(userId, socket.id);
    this.userRoles.set(userId, userRole);

    // Join user to role-based rooms
    socket.join(userRole.toLowerCase());
    socket.join(`user_${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time updates',
      userId,
      role: userRole,
      timestamp: new Date().toISOString()
    });

    // Handle dashboard data requests
    socket.on('request_dashboard_data', async (data) => {
      try {
        await this.handleDashboardDataRequest(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch dashboard data', error: error.message });
      }
    });

    // Handle leave approval requests
    socket.on('approve_leave', async (data) => {
      try {
        await this.handleLeaveApproval(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to process leave approval', error: error.message });
      }
    });

    // Handle performance review requests
    socket.on('create_performance_review', async (data) => {
      try {
        await this.handlePerformanceReviewCreation(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create performance review', error: error.message });
      }
    });

    // Handle team analytics requests
    socket.on('request_team_analytics', async (data) => {
      try {
        await this.handleTeamAnalyticsRequest(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch team analytics', error: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${userId} disconnected`);
      this.connectedUsers.delete(userId);
      this.userRoles.delete(userId);
    });
  }

  async handleDashboardDataRequest(socket, data) {
    const { timeRange = 'week', managerId } = data;
    const userId = socket.userId;

    if (socket.userRole !== 'MANAGER' && socket.userRole !== 'HR' && socket.userRole !== 'ADMIN') {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    try {
      // Get manager's employee record
      const managerEmployee = await database.findOne('employees', { userId: managerId || userId });
      if (!managerEmployee) {
        socket.emit('error', { message: 'Manager profile not found' });
        return;
      }

      // Get team members
      const teamMembers = await database.find('employees', { 
        managerId: new ObjectId(managerEmployee._id) 
      });

      // Get team attendance data
      const teamMemberIds = teamMembers.map(member => member.userId);
      const attendanceData = await this.getTeamAttendanceData(teamMemberIds, timeRange);

      // Get pending leave requests
      const pendingLeaves = await this.getPendingLeaveRequests(teamMemberIds);

      // Get team performance data
      const performanceData = await this.getTeamPerformanceData(teamMemberIds);

      // Get AI insights
      const aiInsights = await this.getAITeamInsights(managerEmployee._id);

      socket.emit('dashboard_data', {
        teamMembers: teamMembers.length,
        attendanceData,
        pendingLeaves,
        performanceData,
        aiInsights,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Dashboard data error:', error);
      socket.emit('error', { message: 'Failed to fetch dashboard data', error: error.message });
    }
  }

  async getTeamAttendanceData(teamMemberIds, timeRange) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const attendanceSummaries = await database.find('attendance_summaries', {
      employeeId: { $in: teamMemberIds },
      date: { $gte: startDate, $lte: endDate }
    });

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPossibleDays = teamMemberIds.length * totalDays;
    const presentDays = attendanceSummaries.reduce((sum, record) => sum + (record.status === 'PRESENT' ? 1 : 0), 0);
    
    return {
      attendanceRate: totalPossibleDays > 0 ? Math.round((presentDays / totalPossibleDays) * 100) : 0,
      totalDays,
      presentDays,
      absentDays: totalPossibleDays - presentDays,
      teamSize: teamMemberIds.length
    };
  }

  async getPendingLeaveRequests(teamMemberIds) {
    const pendingLeaves = await database.find('leave_requests', {
      employeeId: { $in: teamMemberIds },
      status: 'APPLIED'
    });

    // Populate leave type and employee data
    const populatedLeaves = await Promise.all(
      pendingLeaves.map(async (leave) => {
        const leaveType = await database.findOne('leave_types', { _id: leave.leaveTypeId });
        const employee = await database.findOne('employees', { userId: leave.employeeId });
        
        return {
          ...leave,
          leaveType: leaveType?.name || 'Unknown',
          employee: employee ? {
            name: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeCode,
            designation: employee.designation
          } : null
        };
      })
    );

    return populatedLeaves;
  }

  async getTeamPerformanceData(teamMemberIds) {
    const performanceReviews = await database.find('performance_reviews', {
      employeeId: { $in: teamMemberIds },
      status: 'COMPLETED'
    });

    if (performanceReviews.length === 0) {
      return { averageScore: 0, totalReviews: 0 };
    }

    const totalScore = performanceReviews.reduce((sum, review) => sum + (review.overallRating || 0), 0);
    const averageScore = Math.round(totalScore / performanceReviews.length);

    return {
      averageScore,
      totalReviews: performanceReviews.length,
      recentReviews: performanceReviews.slice(0, 5)
    };
  }

  async getAITeamInsights(managerId) {
    // This would integrate with AI service
    // For now, return mock data
    return {
      productivityTrend: 'increasing',
      teamMorale: 'high',
      recommendations: [
        'Consider implementing flexible work hours',
        'Team performance is above average',
        'Schedule regular one-on-ones with team members'
      ],
      riskFactors: [],
      opportunities: [
        'Cross-training opportunities identified',
        'Mentorship program could benefit junior members'
      ]
    };
  }

  async handleLeaveApproval(socket, data) {
    const { leaveId, action, rejectionReason } = data;
    const userId = socket.userId;

    if (socket.userRole !== 'MANAGER' && socket.userRole !== 'HR' && socket.userRole !== 'ADMIN') {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    try {
      // Get leave request
      const leaveRequest = await database.findOne('leave_requests', { _id: new ObjectId(leaveId) });
      if (!leaveRequest) {
        socket.emit('error', { message: 'Leave request not found' });
        return;
      }

      // Update leave request
      const updateData = {
        status: action.toUpperCase(),
        decidedBy: userId,
        decidedAt: new Date(),
        notes: rejectionReason || '',
        updatedAt: new Date()
      };

      await database.updateOne(
        'leave_requests',
        { _id: new ObjectId(leaveId) },
        { $set: updateData }
      );

      // Get employee for notification
      const employee = await database.findOne('employees', { userId: leaveRequest.employeeId });

      // Notify employee
      this.sendToUser(leaveRequest.employeeId, 'leave_decision', {
        leaveRequestId: leaveId,
        status: action.toUpperCase(),
        decidedBy: userId,
        note: rejectionReason,
        timestamp: new Date().toISOString()
      });

      // Notify manager
      socket.emit('leave_approved', {
        success: true,
        leaveRequestId: leaveId,
        status: action.toUpperCase(),
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
      });

      // Broadcast to other managers/HR
      this.broadcastToRole('MANAGER', 'leave_updated', {
        leaveRequestId: leaveId,
        status: action.toUpperCase(),
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        decidedBy: userId
      });

    } catch (error) {
      console.error('Leave approval error:', error);
      socket.emit('error', { message: 'Failed to process leave approval', error: error.message });
    }
  }

  async handlePerformanceReviewCreation(socket, data) {
    const { employeeId, reviewData } = data;
    const userId = socket.userId;

    if (socket.userRole !== 'MANAGER' && socket.userRole !== 'HR' && socket.userRole !== 'ADMIN') {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    try {
      // Create performance review
      const review = {
        employeeId,
        reviewerId: userId,
        ...reviewData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await database.insertOne('performance_reviews', review);

      // Get employee for notification
      const employee = await database.findOne('employees', { userId: employeeId });

      // Notify employee
      this.sendToUser(employeeId, 'performance_review_created', {
        reviewId: result.insertedId,
        reviewerId: userId,
        message: 'New performance review has been created for you'
      });

      // Notify manager
      socket.emit('performance_review_created', {
        success: true,
        reviewId: result.insertedId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
      });

    } catch (error) {
      console.error('Performance review creation error:', error);
      socket.emit('error', { message: 'Failed to create performance review', error: error.message });
    }
  }

  async handleTeamAnalyticsRequest(socket, data) {
    const { timeRange = 'month', managerId } = data;
    const userId = socket.userId;

    if (socket.userRole !== 'MANAGER' && socket.userRole !== 'HR' && socket.userRole !== 'ADMIN') {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    try {
      // Get manager's employee record
      const managerEmployee = await database.findOne('employees', { userId: managerId || userId });
      if (!managerEmployee) {
        socket.emit('error', { message: 'Manager profile not found' });
        return;
      }

      // Get team members
      const teamMembers = await database.find('employees', { 
        managerId: new ObjectId(managerEmployee._id) 
      });

      const teamMemberIds = teamMembers.map(member => member.userId);

      // Get comprehensive analytics
      const analytics = await this.getComprehensiveTeamAnalytics(teamMemberIds, timeRange);

      socket.emit('team_analytics', {
        analytics,
        teamSize: teamMembers.length,
        timeRange,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Team analytics error:', error);
      socket.emit('error', { message: 'Failed to fetch team analytics', error: error.message });
    }
  }

  async getComprehensiveTeamAnalytics(teamMemberIds, timeRange) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get attendance analytics
    const attendanceSummaries = await database.find('attendance_summaries', {
      employeeId: { $in: teamMemberIds },
      date: { $gte: startDate, $lte: endDate }
    });

    // Get leave analytics
    const leaveRequests = await database.find('leave_requests', {
      employeeId: { $in: teamMemberIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get performance analytics
    const performanceReviews = await database.find('performance_reviews', {
      employeeId: { $in: teamMemberIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return {
      attendance: {
        totalDays: attendanceSummaries.length,
        presentDays: attendanceSummaries.filter(r => r.status === 'PRESENT').length,
        absentDays: attendanceSummaries.filter(r => r.status === 'ABSENT').length,
        lateDays: attendanceSummaries.filter(r => r.status === 'LATE').length,
        averageHours: attendanceSummaries.reduce((sum, r) => sum + (r.totalHours || 0), 0) / attendanceSummaries.length || 0
      },
      leaves: {
        totalRequests: leaveRequests.length,
        approved: leaveRequests.filter(r => r.status === 'APPROVED').length,
        rejected: leaveRequests.filter(r => r.status === 'REJECTED').length,
        pending: leaveRequests.filter(r => r.status === 'APPLIED').length,
        totalDays: leaveRequests.reduce((sum, r) => sum + (r.leaveDays || 0), 0)
      },
      performance: {
        totalReviews: performanceReviews.length,
        averageRating: performanceReviews.length > 0 ? 
          performanceReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / performanceReviews.length : 0,
        completed: performanceReviews.filter(r => r.status === 'COMPLETED').length,
        pending: performanceReviews.filter(r => r.status === 'PENDING').length
      }
    };
  }

  // Utility methods for broadcasting
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  broadcastToRole(role, event, data) {
    if (this.io) {
      this.io.to(role.toLowerCase()).emit(event, data);
    }
  }

  broadcastToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users by role
  getUsersByRole(role) {
    const users = [];
    for (const [userId, socketId] of this.connectedUsers) {
      if (this.userRoles.get(userId) === role) {
        users.push({ userId, socketId });
      }
    }
    return users;
  }
}

module.exports = new SocketService();