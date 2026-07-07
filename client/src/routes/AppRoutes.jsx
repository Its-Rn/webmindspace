import { Route, Routes, Navigate, useOutletContext, Outlet } from 'react-router-dom';

import { PrivateLayout } from '../layouts/PrivateLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { BlogEditor } from '../pages/blog/BlogEditor';
import { BlogList } from '../pages/blog/BlogList';
import { BlogView } from '../pages/blog/BlogView';
import { CalendarPage } from '../pages/tasks/CalendarPage';
import { TasksPage } from '../pages/tasks/TasksPage';
import { TimelinePage } from '../pages/timeline/TimelinePage';
import ChatPage from '../pages/chat/ChatPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import NotesPage from '../pages/notes/NotesPage';
import AdminPage from '../pages/admin/AdminPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';

const AdminRoute = () => {
  const { currentUser } = useOutletContext();
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/new" element={<BlogEditor />} />
          <Route path="/blog/:slug" element={<BlogView />} />
          <Route path="/blog/:slug/edit" element={<BlogEditor />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
