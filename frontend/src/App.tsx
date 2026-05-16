import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '@/pages/dashboard/dashboard-layout'
import { EmissionsPage } from '@/pages/dashboard/emissions-page'
import { FacilitiesPage } from '@/pages/dashboard/facilities-page'
import { OverviewPage } from '@/pages/dashboard/overview-page'
import { ReportsPage } from '@/pages/dashboard/reports-page'
import { SettingsPage } from '@/pages/dashboard/settings-page'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="emissions" element={<EmissionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="facilities" element={<FacilitiesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
