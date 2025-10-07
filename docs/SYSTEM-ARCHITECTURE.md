# FWC HRMS - System Architecture Documentation

## 🏗️ Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FWC HRMS SYSTEM                          │
│                    AI-Powered HR Management                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │    │   Admin Panel   │
│   (React.js)    │    │ (React Native)  │    │   (React.js)    │
│   Port: 3000    │    │   (iOS/Android)  │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Load Balancer  │
                    │    (Nginx)       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Backend API    │
                    │  (Node.js)      │
                    │  Port: 5000     │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI/ML Service │    │   Database      │    │   Cache Layer   │
│   (Python)      │    │  (MongoDB)      │    │    (Redis)      │
│   Port: 8000    │    │  Port: 27017    │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Component Architecture

### Frontend Layer (React.js)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Pages     │  │ Components  │  │  Services   │          │
│  │             │  │             │  │             │          │
│  │ • Login     │  │ • Layout    │  │ • API      │           │
│  │ • Dashboard │  │ • Sidebar   │  │ • Auth     │           │
│  │ • Employee  │  │ • Forms     │  │ • Utils    │           │
│  │ • HR        │  │ • Tables    │  │ • Context  │           │
│  │ • Admin     │  │ • Modals    │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Routing   │  │   State     │  │   Styling   │          │
│  │             │  │ Management  │  │             │          │
│  │ • React     │  │ • Context   │  │ • Tailwind  │          │
│  │   Router    │  │ • Hooks     │  │ • Custom    │          │
│  │ • Protected │  │ • Local     │  │   CSS       │          │
│  │   Routes    │  │   Storage   │  │ • Responsive│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Backend Layer (Node.js + Express)

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Routes    │  │ Middleware  │  │   Utils     │         │
│  │             │  │             │  │             │         │
│  │ • Auth      │  │ • Auth      │  │ • BullMQ    │        │
│  │ • Employee  │  │ • Validation│  │ • Email     │        │
│  │ • Attendance│  │ • File      │  │ • Reports   │        │
│  │ • Payroll   │  │   Upload    │  │ • Audit     │        │
│  │ • AI        │  │ • Error     │  │   Logger    │        │
│  │ • HR        │  │   Handler   │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Database  │  │   Security  │  │   Services  │        │
│  │   Layer     │  │             │  │             │        │
│  │ • Prisma    │  │ • JWT       │  │ • Email     │        │
│  │ • MongoDB   │  │ • RBAC      │  │ • SMS       │        │
│  │ • Migrations│  │ • Rate      │  │ • File      │        │
│  │ • Seeds     │  │   Limiting  │  │   Storage   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### AI/ML Service Layer (Python + FastAPI)

```
┌─────────────────────────────────────────────────────────────┐
│                    AI/ML Architecture                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Resume      │  │ Interview   │  │ Predictive  │        │
│  │ Parser      │  │ Chatbot     │  │ Analytics   │        │
│  │             │  │             │  │             │        │
│  │ • NLP       │  │ • Question  │  │ • Performance│        │
│  │ • Skill     │  │   Generation│  │   Prediction│        │
│  │   Extraction│  │ • Answer    │  │ • Retention │        │
│  │ • Experience│  │   Evaluation│  │   Analysis  │        │
│  │   Analysis  │  │ • Scoring   │  │ • Salary    │        │
│  │ • Job Fit   │  │ • Feedback  │  │   Optimization│      │
│  │   Scoring   │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   ML Models │  │   APIs      │  │   Data      │        │
│  │             │  │             │  │   Processing│        │
│  │ • NLP       │  │ • FastAPI   │  │ • Text      │        │
│  │   Models    │  │ • RESTful   │  │   Analysis  │        │
│  │ • ML        │  │ • WebSocket │  │ • Data      │        │
│  │   Algorithms│  │ • Async     │  │   Cleaning  │        │
│  │ • Deep      │  │   Processing│  │ • Feature   │        │
│  │   Learning  │  │             │  │   Extraction│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Architecture

### MongoDB Collections Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Schema                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Users     │  │ Employees   │  │ Departments │        │
│  │             │  │             │  │             │        │
│  │ • _id       │  │ • _id       │  │ • _id       │        │
│  │ • email     │  │ • userId    │  │ • name      │        │
│  │ • password  │  │ • firstName │  │ • managerId │        │
│  │ • role      │  │ • lastName  │  │ • budget    │        │
│  │ • isActive  │  │ • department│  │ • location  │        │
│  │ • createdAt │  │ • position  │  │ • createdAt │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Attendance  │  │ Leave       │  │ Payroll     │        │
│  │             │  │ Requests    │  │             │        │
│  │ • _id       │  │ • _id       │  │ • _id       │        │
│  │ • employeeId│  │ • employeeId│  │ • employeeId│        │
│  │ • clockIn   │  │ • type      │  │ • salary    │        │
│  │ • clockOut  │  │ • startDate │  │ • benefits  │        │
│  │ • date      │  │ • endDate   │  │ • deductions│        │
│  │ • location  │  │ • status    │  │ • netPay    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Job         │  │ Candidates  │  │ Performance │        │
│  │ Postings    │  │             │  │ Reviews     │        │
│  │             │  │             │  │             │        │
│  │ • _id       │  │ • _id       │  │ • _id       │        │
│  │ • title     │  │ • jobId     │  │ • employeeId│        │
│  │ • department│  │ • name      │  │ • reviewerId│        │
│  │ • location  │  │ • email     │  │ • rating    │        │
│  │ • salary    │  │ • resume    │  │ • feedback  │        │
│  │ • status    │  │ • status    │  │ • goals     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                Security Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Login Request                                         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Credential  │                                            │
│  │ Validation  │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ JWT Token   │                                            │
│  │ Generation  │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Role-Based  │                                            │
│  │ Access      │                                            │
│  │ Control     │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Permission  │                                            │
│  │ Validation  │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Resource    │                                            │
│  │ Access      │                                            │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Role Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                Role-Based Access Control                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ADMIN (Level 5)                                            │
│  ├── Full system access                                     │
│  ├── User management                                        │
│  ├── System configuration                                   │
│  └── All permissions                                        │
│                                                             │
│  HR (Level 4)                                               │
│  ├── Employee management                                    │
│  ├── Recruitment                                            │
│  ├── Payroll                                                │
│  └── Performance reviews                                    │
│                                                             │
│  MANAGER (Level 3)                                          │
│  ├── Team management                                        │
│  ├── Attendance oversight                                   │
│  ├── Performance reviews                                    │
│  └── Limited HR access                                      │
│                                                             │
│  EMPLOYEE (Level 2)                                         │
│  ├── Personal data                                          │
│  ├── Attendance tracking                                    │
│  ├── Leave requests                                         │
│  └── Performance goals                                      │
│                                                             │
│  CANDIDATE (Level 1)                                        │
│  ├── Application submission                                 │
│  ├── Profile management                                     │
│  └── Interview scheduling                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                Production Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   CDN       │    │ Load        │    │   Web       │    │
│  │ (Static     │    │ Balancer    │    │ Servers     │    │
│  │  Assets)    │    │ (Nginx)     │    │ (Multiple)  │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             │                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   API       │    │   AI/ML     │    │   Database  │    │
│  │ Servers     │    │ Services    │    │ Cluster     │    │
│  │ (Multiple)  │    │ (Multiple)  │    │ (MongoDB)   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             │                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Cache     │    │   Queue     │    │   Storage   │    │
│  │ (Redis      │    │ (BullMQ)    │    │ (File       │    │
│  │  Cluster)   │    │             │    │  Storage)   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Docker Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Docker Container Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Frontend    │  │ Backend     │  │ AI/ML       │        │
│  │ Container   │  │ Container   │  │ Container   │        │
│  │             │  │             │  │             │        │
│  │ • React     │  │ • Node.js   │  │ • Python    │        │
│  │ • Nginx     │  │ • Express   │  │ • FastAPI   │        │
│  │ • Static    │  │ • Prisma    │  │ • ML Models │        │
│  │   Files     │  │ • MongoDB   │  │ • NLP       │        │
│  │             │  │   Driver    │  │   Libraries │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ MongoDB     │  │ Redis       │  │ Nginx       │        │
│  │ Container   │  │ Container   │  │ Container   │        │
│  │             │  │             │  │             │        │
│  │ • Database  │  │ • Cache     │  │ • Reverse   │        │
│  │ • Data      │  │ • Sessions  │  │   Proxy     │        │
│  │   Volume    │  │ • Queue     │  │ • Load      │        │
│  │             │  │             │  │   Balancer  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Architecture

### Request Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                Data Flow Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Request                                             │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Load        │                                            │
│  │ Balancer    │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ API Gateway │                                            │
│  │ (Express)   │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Middleware  │                                            │
│  │ Stack       │                                            │
│  │ • Auth      │                                            │
│  │ • Validation│                                            │
│  │ • Rate      │                                            │
│  │   Limiting  │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Route       │                                            │
│  │ Handler     │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Business    │                                            │
│  │ Logic       │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Database    │                                            │
│  │ Operation   │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Response    │                                            │
│  │ Generation  │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  Client Response                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 AI Processing Pipeline

### Resume Analysis Flow

```
┌─────────────────────────────────────────────────────────────┐
│                AI Resume Analysis Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Resume Upload                                              │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ File        │                                            │
│  │ Processing  │                                            │
│  │ • PDF/DOCX  │                                            │
│  │ • Text      │                                            │
│  │   Extraction│                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ NLP         │                                            │
│  │ Processing  │                                            │
│  │ • Tokenize  │                                            │
│  │ • Parse     │                                            │
│  │ • Extract   │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Skill       │                                            │
│  │ Extraction  │                                            │
│  │ • Technical │                                            │
│  │ • Soft      │                                            │
│  │ • Languages │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Experience  │                                            │
│  │ Analysis    │                                            │
│  │ • Duration  │                                            │
│  │ • Progression│                                           │
│  │ • Relevance │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Job Fit     │                                            │
│  │ Scoring     │                                            │
│  │ • Compatibility│                                        │
│  │ • Confidence│                                            │
│  │ • Ranking   │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Report      │                                            │
│  │ Generation  │                                            │
│  │ • Insights  │                                            │
│  │ • Recommendations│                                       │
│  │ • Score     │                                            │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Performance & Scalability

### Performance Metrics

- **API Response Time**: <200ms average
- **Database Query Time**: <100ms average
- **Frontend Load Time**: <3 seconds
- **Concurrent Users**: 5000+ supported
- **Throughput**: 10,000+ requests/minute
- **Uptime**: 99.9% availability target

### Scalability Features

- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: Nginx-based distribution
- **Database Sharding**: MongoDB cluster support
- **Caching Strategy**: Redis-based performance optimization
- **Background Processing**: BullMQ job queues
- **CDN Integration**: Static asset delivery optimization

## 🔧 Technology Stack Summary

### Frontend Technologies

- **React 18**: Modern UI framework
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Query**: Data fetching and caching
- **Context API**: State management

### Backend Technologies

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Prisma**: Database ORM
- **MongoDB**: NoSQL database
- **Redis**: In-memory data store
- **BullMQ**: Background job processing
- **JWT**: Authentication tokens

### AI/ML Technologies

- **Python**: Programming language
- **FastAPI**: Modern web framework
- **NLP Libraries**: Natural language processing
- **Machine Learning**: Predictive models
- **Deep Learning**: Advanced AI capabilities
- **TensorFlow/PyTorch**: ML frameworks

### DevOps & Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Web server and reverse proxy
- **Git**: Version control
- **CI/CD**: Continuous integration/deployment
- **Monitoring**: Application performance monitoring

This comprehensive architecture ensures a scalable, secure, and high-performance HR management system that can handle enterprise-level requirements while providing an exceptional user experience.
