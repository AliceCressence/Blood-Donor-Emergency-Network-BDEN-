// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout from '../components/layout/PublicLayout'
import DonorLayout from '../components/layout/DonorLayout'

// Public pages
import LandingPage from '../pages/public/LandingPage'

// Auth pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Donor pages
import DonorDashboard from '../pages/donor/Dashboard'
import DonorCard from '../pages/donor/DonorCard'
import Notifications from '../pages/donor/Notifications'
import MapView from '../pages/donor/MapView'
import ProfileSettings from '../pages/donor/ProfileSettings'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Donor portal */}
        <Route path="/donor" element={<DonorLayout />}>
          <Route index element={<Navigate to="/donor/dashboard" replace />} />
          <Route path="dashboard" element={<DonorDashboard />} />
          <Route path="card" element={<DonorCard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="map" element={<MapView />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
