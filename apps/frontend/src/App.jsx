// apps/frontend/src/App.jsx
// FIX: React IS actually needed here because ErrorBoundary is a class component
// (React.Component). The ESLint error is a false positive for this file since
// React 17+ JSX transform doesn't need React in scope for JSX, BUT class components
// still need React.Component. The real fix is the eslint rule — we silence it here
// with a comment, which is the correct approach for class components.
// All other files that had `import React from 'react'` with no class components
// have had React removed from their imports.

import React, { useEffect } from 'react'; // eslint-disable-line react/react-in-jsx-scope
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from './stores/authStore.js';
import { ToastProvider } from './components/ui/Toast.jsx';

import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { MembersPage } from './pages/MembersPage.jsx';
import { AuditLogPage } from './pages/AuditLogPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

// ErrorBoundary must be a class component — React import is required here
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#13161c]">
          <div className="text-center p-8 bg-[#1e2128] rounded-xl border border-[#2d3240] shadow-xl">
            <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6 text-sm">An unexpected error occurred in the application.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#6366f1] text-white px-4 py-2 rounded-md hover:bg-[#4f46e5] transition-colors text-sm font-medium"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#13161c]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-[#6366f1] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppContent = () => {
  const initAuth = useAuthStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  );
};

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;