import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Role } from '@avtoschoole/shared';
import { AppThemeProvider } from './shared/theme/AppThemeProvider';
import { AppLayout } from './shared/layout/AppLayout';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { GroupsPage } from './features/groups/GroupsPage';
import { GroupDetailPage } from './features/groups/GroupDetailPage';
import { MySchedulePage } from './features/schedule/MySchedulePage';
import { MyBillingPage } from './features/billing/MyBillingPage';
import { InsurancePage } from './features/insurance/InsurancePage';
import { StatsPage } from './features/stats/StatsPage';
import { TransfersPage } from './features/transfers/TransfersPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { CashflowPage } from './features/cashflow/CashflowPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { NotesPage } from './features/notes/NotesPage';
import { SuperAdminDashboardPage } from './features/admin/SuperAdminDashboardPage';
import { ProfilePage } from './features/profile/ProfilePage';

export function App() {
  return (
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <ProtectedRoute roles={[Role.TEACHER, Role.STUDENT]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={[Role.SUPERADMIN]}>
                  <SuperAdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/groups"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute roles={[Role.TEACHER, Role.STUDENT]}>
                  <GroupDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-schedule"
              element={
                <ProtectedRoute roles={[Role.TEACHER, Role.STUDENT]}>
                  <MySchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-billing"
              element={
                <ProtectedRoute roles={[Role.STUDENT]}>
                  <MyBillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <InsurancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <StatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfers"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <TransfersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashflow"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <CashflowPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute roles={[Role.TEACHER]}>
                  <NotesPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}
