// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout from '../components/layout/PublicLayout'

// Public pages
import LandingPage from '../pages/public/LandingPage'

// Auth pages
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          {/* Phase 4: add MythDebunking and CampaignBrowser here */}
        </Route>

        {/* Auth routes — no layout wrapper (full-screen pages) */}
        <Route path="login"    element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
