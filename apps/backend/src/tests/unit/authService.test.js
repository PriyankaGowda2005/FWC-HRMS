// Comprehensive unit tests for authentication service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  createTestUser,
  createTestAdmin,
  generateTestToken,
  generateTestRefreshToken,
  hashPassword,
  expectValidUser,
  expectUnauthorizedError
} = require('./testUtils');

// Mock the database models
jest.mock('../../database/connection', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn()
  },
  Employee: {
    create: jest.fn(),
    findOne: jest.fn()
  }
}));

const authService = require('../../services/authService');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = createTestUser();
      const hashedPassword = await hashPassword(userData.password);
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        role: userData.role,
        password: hashedPassword
      };

      const mockEmployee = {
        id: 'emp-123',
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        position: userData.position
      };

      const { User, Employee } = require('../../database/connection');
      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.create.mockResolvedValue(mockUser);
      Employee.create.mockResolvedValue(mockEmployee);

      // Act
      const result = await authService.register(userData);

      // Assert
      expectValidUser(result.user);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.role).toBe(userData.role);
      expect(result.employee.firstName).toBe(userData.firstName);
      expect(result.employee.lastName).toBe(userData.lastName);
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const userData = createTestUser();
      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue({ email: userData.email });

      // Act & Assert
      await expect(authService.register(userData))
        .rejects.toThrow('User already exists');
    });

    it('should hash password before storing', async () => {
      // Arrange
      const userData = createTestUser();
      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(null);
      User.create.mockImplementation((data) => {
        expect(data.password).not.toBe(userData.password);
        expect(data.password.length).toBeGreaterThan(50); // bcrypt hash length
        return Promise.resolve({ id: 'user-123', ...data });
      });

      // Act
      await authService.register(userData);

      // Assert
      expect(User.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const userData = createTestUser();
      const hashedPassword = await hashPassword(userData.password);
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        role: userData.role,
        password: hashedPassword
      };

      const mockEmployee = {
        id: 'emp-123',
        firstName: userData.firstName,
        lastName: userData.lastName
      };

      const { User, Employee } = require('../../database/connection');
      User.findOne.mockResolvedValue(mockUser);
      Employee.findOne.mockResolvedValue(mockEmployee);

      // Act
      const result = await authService.login(userData.email, userData.password);

      // Assert
      expectValidUser(result.user);
      expect(result.user.email).toBe(userData.email);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login('invalid@email.com', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const userData = createTestUser();
      const hashedPassword = await hashPassword(userData.password);
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        password: hashedPassword
      };

      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(userData.email, 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const userData = createTestUser();
      const refreshToken = generateTestRefreshToken(userData);
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        role: userData.role
      };

      const { User } = require('../../database/connection');
      User.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.token).not.toBe(refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      // Act & Assert
      await expect(authService.refreshToken('invalid-token'))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // Arrange
      const userData = createTestUser();
      const token = generateTestToken(userData);

      // Act
      const result = await authService.verifyToken(token);

      // Assert
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
    });

    it('should throw error for invalid token', async () => {
      // Act & Assert
      await expect(authService.verifyToken('invalid-token'))
        .rejects.toThrow('Invalid token');
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const userData = createTestUser();
      const expiredToken = jwt.sign(
        { userId: 'user-123', email: userData.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired token
      );

      // Act & Assert
      await expect(authService.verifyToken(expiredToken))
        .rejects.toThrow('Token expired');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userData = createTestUser();
      const oldPassword = userData.password;
      const newPassword = 'newpassword123';
      const hashedOldPassword = await hashPassword(oldPassword);
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        password: hashedOldPassword
      };

      const { User } = require('../../database/connection');
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, password: 'new-hash' });

      // Act
      const result = await authService.changePassword('user-123', oldPassword, newPassword);

      // Assert
      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          password: expect.any(String)
        }),
        { new: true }
      );
    });

    it('should throw error for wrong old password', async () => {
      // Arrange
      const userData = createTestUser();
      const hashedPassword = await hashPassword(userData.password);
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        password: hashedPassword
      };

      const { User } = require('../../database/connection');
      User.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.changePassword('user-123', 'wrongpassword', 'newpassword'))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for valid email', async () => {
      // Arrange
      const userData = createTestUser();
      const mockUser = {
        id: 'user-123',
        email: userData.email
      };

      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Act
      const result = await authService.forgotPassword(userData.email);

      // Assert
      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date)
        }),
        { new: true }
      );
    });

    it('should return false for non-existent email', async () => {
      // Arrange
      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(null);

      // Act
      const result = await authService.forgotPassword('nonexistent@email.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      const userData = createTestUser();
      const resetToken = 'valid-reset-token';
      const newPassword = 'newpassword123';
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour from now
      };

      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Act
      const result = await authService.resetPassword(resetToken, newPassword);

      // Assert
      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          password: expect.any(String),
          resetPasswordToken: null,
          resetPasswordExpires: null
        }),
        { new: true }
      );
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.resetPassword('invalid-token', 'newpassword'))
        .rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const userData = createTestUser();
      const expiredToken = 'expired-reset-token';
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        resetPasswordToken: expiredToken,
        resetPasswordExpires: new Date(Date.now() - 3600000) // 1 hour ago
      };

      const { User } = require('../../database/connection');
      User.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.resetPassword(expiredToken, 'newpassword'))
        .rejects.toThrow('Invalid or expired reset token');
    });
  });
});
