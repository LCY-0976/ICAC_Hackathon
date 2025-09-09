import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Pages
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ContractsPage } from '@/pages/ContractsPage';
import { CorruptionAnalysisPage } from '@/pages/CorruptionAnalysisPage';
import { UploadContractPage } from '@/pages/UploadContractPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BlockchainExplorerPage } from '@/pages/BlockchainExplorerPage';
import { CreateBlockPage } from '@/pages/CreateBlockPage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// App Layout Component
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}


// Main App Component
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <AppLayout>
          <HomePage />
        </AppLayout>
      } />

      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/contracts" element={
        <ProtectedRoute>
          <AppLayout>
            <ContractsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/corruption-analysis" element={
        <ProtectedRoute>
          <AppLayout>
            <CorruptionAnalysisPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/upload-contract" element={
        <ProtectedRoute>
          <AppLayout>
            <UploadContractPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/blockchain-explorer" element={
        <ProtectedRoute>
          <AppLayout>
            <BlockchainExplorerPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/create-block" element={
        <ProtectedRoute>
          <AppLayout>
            <CreateBlockPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={
        <AppLayout>
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Go Home
            </a>
          </div>
        </AppLayout>
      } />
    </Routes>
  );
}

// Root App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;