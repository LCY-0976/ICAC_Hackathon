# ICAC Hackathon Frontend

A modern React + TypeScript frontend for the ICAC Blockchain contract management platform with corruption analysis capabilities.

## 🚀 Features

- **Modern React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for icons
- **Authentication System** with JWT tokens
- **Responsive Design** for all devices
- **Component Library** with reusable UI components

## 🛠️ Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Card, etc.)
│   └── layout/         # Layout components (Header, Footer)
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Utilities and API client
├── pages/             # Page components
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Integration

The frontend connects to the backend API running on `http://localhost:8000`. Key features include:

- **Authentication** - Login/Register with JWT tokens
- **Contract Management** - Upload, sign, and manage contracts
- **Corruption Analysis** - AI-powered risk assessment
- **Blockchain Integration** - View blockchain-stored contracts

## 🎨 UI Components

### Basic Components
- `Button` - Customizable button with variants
- `Card` - Container component with header/content
- `Badge` - Status indicators
- `Input` - Form input components
- `LoadingSpinner` - Loading indicators

### Layout Components
- `Header` - Navigation header with auth
- `Footer` - Site footer with links

### Pages
- `HomePage` - Landing page with features
- `LoginPage` - User authentication
- `RegisterPage` - User registration
- `DashboardPage` - User dashboard (placeholder)
- `ContractsPage` - Contract management (placeholder)
- `CorruptionAnalysisPage` - AI analysis (placeholder)

## 🔐 Authentication

The app uses JWT token-based authentication:

1. Users login with user_id and password
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. Token sent with API requests via Axios interceptor
5. Auto-redirect to login on 401 responses

### Demo Credentials
- **User ID:** alice001
- **Password:** password123

## 🚦 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 8000

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the backend API on port 8000
4. Start the frontend: `npm run dev`
5. Open http://localhost:3000

### Environment Setup
The frontend expects the backend API to be running on `http://localhost:8000`. This is configured in:
- `vite.config.ts` - Proxy configuration for development
- `src/lib/api.ts` - API base URL

## 📱 Responsive Design

The frontend is fully responsive and works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1280px+)

## 🎯 Future Enhancements

The current implementation provides a solid foundation with placeholders for:

- **Full Contract Management** - Complete CRUD operations
- **Advanced Corruption Analysis** - Detailed AI-powered insights
- **Real-time Updates** - WebSocket integration
- **File Upload** - Contract document handling
- **Advanced Dashboard** - Analytics and reporting
- **User Management** - Admin features
- **Notifications** - Real-time alerts

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Add proper error handling
4. Test responsive design
5. Update documentation

## 📄 License

This project is part of the ICAC Hackathon submission.