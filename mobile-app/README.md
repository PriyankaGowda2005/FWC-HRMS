# 📱 FWC HRMS Mobile App

A comprehensive React Native mobile application for the FWC HRMS system, providing employees with seamless access to HR services on the go.

## 🚀 Features

### ✅ Core Mobile Features
- **🔐 Secure Authentication** - JWT-based login with biometric support
- **📊 Employee Dashboard** - Real-time attendance, leave balance, and notifications
- **⏰ Time & Attendance** - Clock in/out with location tracking
- **🗓️ Leave Management** - Submit request leave and track status
- **💼 Job Applications** - Apply for positions with resume upload
- **👤 Employee Profile** - Update personal information and documents
- **📱 Offline Support** - Works without internet for essential features
- **🔔 Push Notifications** - Real-time alerts for approvals and updates

### 🎨 User Experience
- **Modern UI/UX** - Material Design with React Native Paper
- **Dark/Light Themes** - User preference support
- **Responsive Design** - Optimized for all screen sizes
- **Gesture Navigation** - Intuitive touch interactions
- **Biometric Security** - Fingerprint/Face ID for quick access

## 📋 Prerequisites

### Required Software
- **Node.js** (v18+)
- **React Native CLI** - `npm install -g react-native-cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)

### Mobile Development Setup
```bash
# Install React Native CLI
npm install -g react-native-cli

# Install Android dependencies
# Follow: https://reactnative.dev/docs/environment-setup
```

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..
```

### 2. Configure API Connection
Edit `src/services/ApiService.ts`:
```typescript
private baseURL = 'http://localhost:3001/api'; // Development
// For production: 'https://api.fwchrms.com/api'
```

### 3. Environment Setup

**Android Development:**
- Start Android emulator or connect physical device
- Run: `npm run android`

**iOS Development (macOS only):**
- Open simulator or connect iOS device
- Run: `npm run ios`

## 📱 Running the App

### Development Mode
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

### Production Build
```bash
# Android APK
npm run build:android

# iOS (macOS only)
npm run build:ios
```

## 🗂️ Project Structure

```
mobile-app/
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── LeaveScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── JobListScreen.tsx
│   │   └── ApplyJobScreen.tsx
│   ├── services/          # API and business logic
│   │   ├── ApiService.ts
│   │   └── AuthService.ts
│   ├── types/             # TypeScript definitions
│   │   └── navigation.ts
│   └── App.tsx            # Main app component
├── android/               # Android-specific code
├── ios/                   # iOS-specific code
└── package.json           # Dependencies and scripts
```

## 🔧 API Integration

### Authentication Flow
```typescript
// Login
const response = await AuthService.login({
  email: 'user@company.com',
  password: 'password123'
});

// Auto-refresh tokens
const isValid = await AuthService.isAuthenticated();
```

### Data Fetching
```typescript
// Employee dashboard
const dashboardData = await ApiService.getDashboardData();

// Attendance history
const attendanceData = await ApiService.getAttendanceHistory();

// Apply for job
const formData = new FormData();
formData.append('resumeFile', resume);
formData.append('firstName', firstName);
const application = await ApiService.applyForJob(formData);
```

## 📊 App Screens

### 1. **Login Screen**
- Email/password authentication
- Quick login for demo purposes
- Biometric login option
- Password strength validation

### 2. **Dashboard Screen**
- Today's attendance status
- Quick action buttons (Clock In/Out, Leave Request)
- Monthly statistics overview
- Pending notifications summary

### 3. **Attendance Screen**
- Clock in/out functionality
- Today's time tracking
- Monthly attendance calendar
- Recent attendance history

### 4. **Leave Management**
- Submit leave requests
- View leave balance
- Track application status
- Leave history calendar

### 5. **Job Applications**
- Browse open positions
- Apply with resume upload
- Track application status
- Interview scheduling

### 6. **Profile Management**
- Update personal information
- Upload documents
- Change password
- Notification preferences

## 🔒 Security Features

### Authentication Security
- JWT tokens with automatic refresh
- Secure token storage using Keychain/Keystore
- Biometric authentication integration
- Session timeout and re-authentication

### Data Protection
- SSL/TLS encryption for API calls
- Secure file upload for resumes
- Local data encryption for sensitive information
- Certificate pinning for production builds

## 📱 Platform-Specific Features

### Android
- Material Design UI components
- Android notifications
- Android biometric authentication
- Background processing for sync

### iOS
- Native iOS design elements
- iOS notifications and badges
- Face ID/Touch ID integration
- iOS Keychain for credential storage

## 🔄 Offline Capabilities

The app works offline for core features:
- View cached attendance records
- Draft leave requests
- Access previous payslips
- Read cached notifications

Data syncs automatically when connection is restored.

## 📈 Performance Optimizations

### Code Splitting
- Lazy loading of screens
- Optimized bundle size
- Memory-efficient image handling

### Caching Strategy
- API response caching
- Image caching and optimization
- Offline data persistence

### Network Optimization
- Request batching
- Automatic retry with exponential backoff
- Request deduplication

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run Jest tests
npm run test:coverage      # Coverage report
```

### E2E Tests
```bash
npm run test:e2e           # Detox E2E tests
npm run test:e2e:android   # Android E2E
npm run test:e2e:ios       # iOS E2E
```

## 📦 Deployment

### Development Build
```bash
npm run build:dev
```

### Staging Build
```bash
npm run build:staging
```

### Production Build
```bash
npm run build:production
```

## 🔧 Troubleshooting

### Common Issues

**Metro bundler errors:**
```bash
npx react-native start --reset-cache
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

**API connection issues:**
- Check if backend is running on correct port
- Verify device/emulator can reach the API
- Check network security configuration

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Native Paper UI Library](https://reactnativepaper.com/)
- [React Navigation](https://reactnavigation.org/)
- [FWC HRMS Backend API](http://localhost:3001/docs)

## 👥 Development Team

- **Mobile Development**: React Native experts
- **UI/UX Design**: Material Design implementation
- **Backend Integration**: RESTful API connectivity
- **Security**: Biometric and encrypted data handling

---

**🚀 Ready for production deployment with App Store and Google Play!**

The mobile app provides a complete, professional-grade HRM experience that rivals enterprise solutions while maintaining accessibility and user-friendly design.
