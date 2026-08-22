import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { Employees } from './pages/Employees';
import { EmployeeDetail } from './pages/EmployeeDetail';
import { Departments } from './pages/Departments';
import { Attendance } from './pages/Attendance';
import { Leave } from './pages/Leave';
import { LeaveRequests } from './pages/LeaveRequests';
import { Payroll } from './pages/Payroll';
import { SalaryStructures } from './pages/SalaryStructures';
import { SalarySlips } from './pages/SalarySlips';
import { Announcements } from './pages/Announcements';
import { Notifications } from './pages/Notifications';
import { AuditLogs } from './pages/AuditLogs';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN' || role === 'HR') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Navigate to="/employee-dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected App Routes inside Layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<RootRedirect />} />

                {/* Dashboards */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employee-dashboard"
                  element={
                    <ProtectedRoute>
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Employees */}
                <Route
                  path="/employees"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                      <Employees />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employees/:id"
                  element={
                    <ProtectedRoute>
                      <EmployeeDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Departments */}
                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute>
                      <Departments />
                    </ProtectedRoute>
                  }
                />

                {/* Attendance */}
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute>
                      <Attendance />
                    </ProtectedRoute>
                  }
                />

                {/* Leave */}
                <Route
                  path="/leave"
                  element={
                    <ProtectedRoute>
                      <Leave />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leave-requests"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                      <LeaveRequests />
                    </ProtectedRoute>
                  }
                />

                {/* Payroll & Salaries */}
                <Route
                  path="/payroll"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                      <Payroll />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/salary-structures"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                      <SalaryStructures />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/salary-slips"
                  element={
                    <ProtectedRoute>
                      <SalarySlips />
                    </ProtectedRoute>
                  }
                />

                {/* Bulletins & Communications */}
                <Route
                  path="/announcements"
                  element={
                    <ProtectedRoute>
                      <Announcements />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Audit Logs */}
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />

                {/* Profile & Settings */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
