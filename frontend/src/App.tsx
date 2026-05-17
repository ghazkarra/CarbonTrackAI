import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/pages/dashboard/dashboard-layout'
import { AlertsPage } from '@/pages/dashboard/alerts-page'
import { OverviewPage } from '@/pages/dashboard/overview-page'
import { ReportCreatePage } from '@/pages/dashboard/report-create-page'
import { ReportPrintPage } from '@/pages/dashboard/report-print-page'
import { ReportPreviewPage } from '@/pages/dashboard/report-preview-page'
import { ReportsPage } from '@/pages/dashboard/reports-page'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/pages/login-page'
import { MachineUsagePage } from '@/pages/dashboard/machine-usage-page'
import { MachineUsageDetailPage } from '@/pages/dashboard/machine-usage-detail-page'
import { MachineUsageFormPage } from '@/pages/dashboard/machine-usage-form-page'
import { RegisterPage } from '@/pages/register-page'
import { SuperadminDatasetsPage } from '@/pages/dashboard/superadmin-datasets-page'
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
        <Route path="/dashboard/reports/:reportId/print" element={<ReportPrintPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="machine-usage" element={<MachineUsagePage />} />
          <Route path="machine-usage/new" element={<MachineUsageFormPage />} />
          <Route path="machine-usage/:usageId" element={<MachineUsageDetailPage />} />
          <Route path="machine-usage/:usageId/edit" element={<MachineUsageFormPage mode="edit" />} />
          <Route path="recommendations" element={<Navigate to="/dashboard/alerts" replace />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/create" element={<ReportCreatePage />} />
          <Route path="reports/:reportId/preview" element={<ReportPreviewPage />} />
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
