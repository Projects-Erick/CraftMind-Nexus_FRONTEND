import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPanel from './pages/admin/AdminPanel';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import NotFound from './pages/NotFound';

// Shared pages
import UsersPage from './pages/shared/UsersPage';
import ClassesPage from './pages/shared/ClassesPage';
import QuestionsPage from './pages/teacher/QuestionsPage';
import AssignmentsPage from './pages/teacher/AssignmentsPage';
import SubmissionsPage from './pages/teacher/SubmissionsPage';
import GradesPage from './pages/shared/GradesPage';
import ReportsPage from './pages/shared/ReportsPage';
import ProfilePage from './pages/shared/ProfilePage';
import DesignReviewPage from './pages/teacher/DesignReviewPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

// Protected route
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-craft-darker flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-craft-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-purple-300">Carregando CraftMind Nexus...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

// Role-based dashboard redirect
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const routes = {
    admin: '/admin',
    secretary: '/secretary',
    teacher: '/teacher',
    student: '/student'
  };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1E1B4B', color: '#E0E7FF', border: '1px solid #4F46E5' }
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Redirect base */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/panel" element={<ProtectedRoute allowedRoles={['admin','secretary']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin','secretary']}><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin','secretary']}><ClassesPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin','secretary']}><ReportsPage /></ProtectedRoute>} />

            {/* Secretary */}
            <Route path="/secretary" element={<ProtectedRoute allowedRoles={['admin','secretary']}><SecretaryDashboard /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['admin','teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/questions" element={<ProtectedRoute allowedRoles={['admin','teacher']}><QuestionsPage /></ProtectedRoute>} />
            <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['admin','teacher']}><AssignmentsPage /></ProtectedRoute>} />
            <Route path="/teacher/submissions" element={<ProtectedRoute allowedRoles={['admin','teacher']}><SubmissionsPage /></ProtectedRoute>} />
            <Route path="/teacher/design-review" element={<ProtectedRoute allowedRoles={['admin','teacher']}><DesignReviewPage /></ProtectedRoute>} />
            <Route path="/teacher/grades" element={<ProtectedRoute allowedRoles={['admin','teacher']}><GradesPage /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']}><GradesPage readOnly /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
