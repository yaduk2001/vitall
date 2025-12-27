# 🎓 Vital - Advanced Learning Management Platform

> A next-generation educational platform featuring AI-powered study companions, interactive 3D avatars, real-time course management, and comprehensive learning analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

---

## 🌟 **Key Features**

### 🤖 **AI-Powered Study Buddy**
- **Interactive 3D Avatar** - Fully animated 3D character using Three.js and WebGL
- **Draggable Interface** - Move buddy and chat panel anywhere on screen
- **Voice Synthesis** - Natural text-to-speech greetings and responses
- **Contextual AI** - Connects to any Python AI backend (OpenAI, Gemini, local models)
- **Personalization** - Custom buddy names, appearances, and personalities
- **Multi-page Support** - Follows you across different sections of the platform

### 📚 **Comprehensive Course Management**
- **Multi-module Courses** - Organize content into structured learning paths
- **Progress Tracking** - Real-time monitoring of student progress
- **Continue Watching** - Resume exactly where you left off
- **Course Enrollment** - Easy subscription and enrollment system
- **Rich Media Support** - Videos, documents, quizzes, and interactive content
- **Thumbnail Previews** - Visual course browsing experience

### 👥 **Multi-Role System**
- **Students** - Access courses, track progress, interact with AI buddy
- **Tutors** - Create and manage courses, upload content, track student engagement
- **Organizations** - Manage multiple tutors and course catalogs
- **Admin** - Platform-wide management and analytics

### 📊 **Learning Analytics**
- **Streak Tracking** - Daily login streaks with motivational messages
- **Progress Visualization** - Beautiful charts and progress rings
- **Watch History** - Complete learning history with timestamps
- **Certificate System** - Track completed courses and achievements
- **Engagement Metrics** - Time spent, completion rates, and more

### 🔔 **Real-time Notifications**
- **New Course Alerts** - Get notified when subscribed tutors publish content
- **Progress Updates** - Track your learning milestones
- **Smart Filtering** - Mark as read, delete, or view all notifications
- **Unread Badges** - Visual indicators for new notifications

### 🎨 **Modern UI/UX**
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready** - Eye-friendly interface for extended learning sessions
- **Smooth Animations** - Framer Motion powered transitions
- **Glassmorphism** - Modern, premium aesthetic design
- **Voice Search** - Hands-free course searching
- **Real-time Search** - Instant results as you type

---

## 🏗️ **Architecture**

```
Vital/
├── backend/                    # Express.js + Node.js Server
│   ├── server.js              # Main server entry point
│   ├── routes/                # API route handlers
│   │   ├── auth.js           # Authentication routes
│   │   ├── courses.js        # Course management
│   │   ├── videos.js         # Video content
│   │   ├── enrollments.js    # Student enrollments
│   │   ├── subscriptions.js  # Channel subscriptions
│   │   ├── notifications.js  # Notification system
│   │   ├── chat.js           # Gemini AI chat integration
│   │   └── buddyChat.js      # Study buddy AI (placeholder)
│   ├── ai/                    # Python AI integration
│   │   └── buddy_ai.py       # AI processing script
│   ├── uploads/               # User-uploaded content
│   └── .env                   # Backend configuration
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/            # Main application pages
│   │   │   ├── Home.tsx      # Student dashboard
│   │   │   ├── Login.tsx     # Authentication
│   │   │   ├── VideoPlayer.tsx    # Course viewer
│   │   │   ├── BuddyStudio.tsx    # 3D buddy customization
│   │   │   ├── TutorDashboard.tsx # Tutor management
│   │   │   └── Organization.tsx   # Organization view
│   │   │
│   │   ├── components/       # Reusable components
│   │   │   ├── StudentBuddy.tsx      # AI buddy overlay
│   │   │   ├── BuddyModelViewer.tsx  # 3D model renderer
│   │   │   ├── Buddy3DViewer.tsx     # 3D viewer utilities
│   │   │   └── ...
│   │   │
│   │   └── assets/           # Static assets
│   │       └── studybuddy/   # 3D models (.glb files)
│   │
│   └── .env                   # Frontend configuration
│
├── BUDDY_AI_INTEGRATION_GUIDE.md  # AI integration documentation
└── README.md                       # This file
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Python 3.8+ (for AI features)
- Modern browser with WebGL support

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/vital.git
cd vital
```

### **2. Backend Setup**

```bash
cd backend
npm install

# Create .env file
cat > .env << EOL
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:4321
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
EOL

# Start backend server
npm run dev
```

Backend runs on: **http://localhost:5000**

### **3. Frontend Setup**

```bash
cd frontend
npm install

# Create .env file
cat > .env << EOL
PUBLIC_BACKEND_URL=http://localhost:5000
EOL

# Start frontend
npm run dev
```

Frontend runs on: **http://localhost:4321**

### **4. (Optional) AI Buddy Setup**

See [BUDDY_AI_INTEGRATION_GUIDE.md](./BUDDY_AI_INTEGRATION_GUIDE.md) for detailed instructions on connecting Python AI backends.

---

## 🔧 **Environment Variables**

### **Backend (.env)**
```env
PORT=5000                                    # Server port
NODE_ENV=development                         # Environment mode
FRONTEND_URL=http://localhost:4321          # CORS configuration
GEMINI_API_KEY=your_api_key                 # Google Gemini API key
JWT_SECRET=your_secret_key                  # JWT authentication secret
DATABASE_URL=mongodb://localhost:27017/vital # Optional: Database connection
```

### **Frontend (.env)**
```env
PUBLIC_BACKEND_URL=http://localhost:5000    # Backend API URL
```

---

## 🌐 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Courses**
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course (tutor only)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### **Enrollments**
- `GET /api/enrollments/by-student/:studentId` - Get student enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:id` - Unenroll from course

### **Progress Tracking**
- `GET /api/continue-watching/:studentId` - Get continue watching list
- `POST /api/progress` - Update learning progress
- `GET /api/progress/:studentId/:courseId` - Get course progress

### **Notifications**
- `GET /api/notifications/by-student/:studentId` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### **AI Chat**
- `POST /api/chat` - Gemini AI chat (general)
- `POST /api/buddy/chat` - Study buddy AI (customizable)

### **Subscriptions**
- `GET /api/subscriptions/by-student/:studentId` - Get subscriptions
- `POST /api/subscriptions` - Subscribe to tutor
- `DELETE /api/subscriptions/:id` - Unsubscribe

---

## 🎯 **Technology Stack**

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Three.js** | 3D graphics rendering |
| **React Router** | Client-side routing |
| **Framer Motion** | Animations |
| **Web Speech API** | Voice recognition & synthesis |

### **Backend**
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **JWT** | Authentication |
| **Multer** | File uploads |
| **CORS** | Cross-origin requests |
| **Google Gemini AI** | AI chat integration |

### **3D & Graphics**
| Technology | Purpose |
|------------|---------|
| **WebGL** | Hardware-accelerated 3D |
| **GLTFLoader** | 3D model loading |
| **OrbitControls** | Camera manipulation |
| **AnimationMixer** | Character animations |

---

## 🤖 **AI Integration**

Vital supports multiple AI backends for the Study Buddy feature:

### **Supported AI Models**
✅ OpenAI GPT (GPT-3.5, GPT-4)  
✅ Google Gemini (Gemini Pro, Gemini Flash)  
✅ Local LLMs (Llama, Mistral, etc.)  
✅ Custom ML models  
✅ Rule-based chatbots  

### **Integration Methods**
1. **Node.js Backend Route** (Recommended)
2. **Separate Python Server** (Flask/FastAPI)
3. **Direct Integration** (python-shell)

📖 **Full Guide:** [BUDDY_AI_INTEGRATION_GUIDE.md](./BUDDY_AI_INTEGRATION_GUIDE.md)

---

## 📱 **Features in Detail**

### **Study Buddy System**

The AI-powered study buddy is a unique feature that provides:

- **3D Avatar Rendering** - Smooth 60fps animations using WebGL
- **Contextual Conversations** - Remembers conversation history
- **Personality Customization** - Different buddy models and personalities
- **Voice Interaction** - Text-to-speech with customizable voices
- **Draggable UI** - Position buddy and chat anywhere on screen
- **Smart Activation** - Only appears on student pages
- **Offline Fallback** - Demo mode when AI backend unavailable

### **Progress Tracking**

Advanced analytics to keep students motivated:

- **Daily Streaks** - Gamified learning consistency
- **Continue Watching** - Resume from exact timestamp
- **Completion Percentage** - Visual progress indicators
- **Learning History** - Complete activity log
- **Achievement Badges** - Milestone celebrations

### **Course Management**

Powerful tools for educators:

- **Multi-module Structure** - Organize content hierarchically
- **Rich Media Upload** - Videos, PDFs, images, quizzes
- **Student Analytics** - Track engagement and progress
- **Bulk Operations** - Manage multiple courses efficiently
- **Version Control** - Update content without breaking enrollments

---

## 🎨 **UI/UX Highlights**

### **Design Principles**
- **Mobile-First** - Responsive on all devices
- **Accessibility** - WCAG 2.1 compliant
- **Performance** - Optimized for 60fps animations
- **Consistency** - Unified design language
- **Feedback** - Clear user feedback for all actions

### **Visual Features**
- Gradient backgrounds with animated orbs
- Glassmorphism effects
- Smooth page transitions
- Skeleton loading states
- Toast notifications
- Context menus
- Drag & drop interfaces

---

## 🔒 **Security Features**

- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ Input validation & sanitization
- ✅ File upload restrictions
- ✅ Rate limiting (planned)
- ✅ XSS protection
- ✅ CSRF tokens (planned)

---

## 📊 **Performance Optimizations**

### **Frontend**
- Code splitting & lazy loading
- Image optimization
- Asset compression
- Browser caching
- Virtual scrolling for large lists
- Debounced search
- Memoized components

### **Backend**
- Response compression
- Database indexing
- Query optimization
- File streaming
- Connection pooling
- Caching layer (planned)

### **3D Rendering**
- LOD (Level of Detail) models
- Texture compression
- GPU instancing
- Frustum culling
- Efficient animation blending

---

## 🚨 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check if port 5000 is available, verify .env file |
| **Frontend can't connect** | Ensure backend is running, check CORS settings |
| **3D buddy not loading** | Verify WebGL support, check browser console |
| **AI responses not working** | Implement `/api/buddy/chat` route, check API keys |
| **File uploads failing** | Check `uploads/` directory permissions |
| **Authentication errors** | Verify JWT_SECRET is set, check token expiration |

### **Debug Mode**

Enable detailed logging:
```bash
# Backend
NODE_ENV=development npm run dev

# Frontend
npm run dev -- --debug
```

---

## 🧪 **Testing**

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📦 **Deployment**

### **Production Build**

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build  # If using TypeScript
```

### **Environment Setup**

Update `.env` files for production:
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

### **Recommended Hosting**
- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Backend:** Railway, Render, AWS EC2, DigitalOcean
- **Database:** MongoDB Atlas, PostgreSQL on Railway
- **Media Storage:** AWS S3, Cloudinary

---

## 🗺️ **Roadmap**

### **Version 2.0 (Upcoming)**
- [ ] Real-time collaboration features
- [ ] Live video streaming
- [ ] Advanced analytics dashboard
- [ ] Mobile apps (React Native)
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Gamification system
- [ ] Social learning features

### **Future Enhancements**
- [ ] VR/AR learning experiences
- [ ] Blockchain certificates
- [ ] Peer-to-peer tutoring
- [ ] AI-generated quizzes
- [ ] Voice-controlled navigation
- [ ] Advanced accessibility features

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Maintain code formatting (Prettier)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 **Team**

- **Lead Developer** - [Your Name]
- **UI/UX Designer** - [Designer Name]
- **AI Integration** - [AI Specialist Name]

---

## 📞 **Support**

- **Documentation:** [docs.vital.com](https://docs.vital.com)
- **Issues:** [GitHub Issues](https://github.com/yourusername/vital/issues)
- **Email:** support@vital.com
- **Discord:** [Join our community](https://discord.gg/vital)

---

## 🙏 **Acknowledgments**

- Three.js community for 3D rendering support
- Google Gemini team for AI capabilities
- React community for amazing tools and libraries
- All contributors and testers

---

## 📈 **Stats**

![GitHub stars](https://img.shields.io/github/stars/yourusername/vital?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/vital?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/vital)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/vital)

---

<div align="center">

**Made with ❤️ for learners worldwide**

[⬆ Back to Top](#-vital---advanced-learning-management-platform)

</div>
