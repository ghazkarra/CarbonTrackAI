import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/pages/dashboard/dashboard-layout'
import { AlertsPage } from '@/pages/dashboard/alerts-page'
import { OverviewPage } from '@/pages/dashboard/overview-page'
import { ReportsPage } from '@/pages/dashboard/reports-page'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/pages/login-page'
import { MachineUsagePage } from '@/pages/dashboard/machine-usage-page'
import { RegisterPage } from '@/pages/register-page'
import { SuperadminDatasetsPage } from '@/pages/dashboard/superadmin-datasets-page'
import { RecommendationsPage } from '@/pages/dashboard/recommendations-page'
import { SuperadminPage } from '@/pages/dashboard/superadmin-page'
import { SuperadminUserDetailPage } from '@/pages/dashboard/superadmin-user-detail-page'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute role="operator" />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="machine-usage" element={<MachineUsagePage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="emissions" element={<Navigate to="/dashboard" replace />} />
          <Route path="facilities" element={<Navigate to="/dashboard" replace />} />
          <Route path="settings" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="superadmin" />}>
        <Route path="/dashboard/superadmin" element={<DashboardLayout />}>
          <Route index element={<SuperadminPage />} />
          <Route path="users/:userId" element={<SuperadminUserDetailPage />} />
          <Route path="datasets" element={<SuperadminDatasetsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
