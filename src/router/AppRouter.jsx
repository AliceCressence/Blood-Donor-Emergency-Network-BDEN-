// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout   from '../components/layout/PublicLayout'
import DonorLayout    from '../components/layout/DonorLayout'
import HospitalLayout from '../components/layout/HospitalLayout'
import AdminLayout    from '../components/layout/AdminLayout'

// Public
import LandingPage from '../pages/public/LandingPage'

// Auth
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Donor pages
import DonorDashboard  from '../pages/donor/Dashboard'
import DonorCard       from '../pages/donor/DonorCard'
import Notifications   from '../pages/donor/Notifications'
import MapView         from '../pages/donor/MapView'
import ProfileSettings from '../pages/donor/ProfileSettings'

// Hospital pages
import HospitalDashboard from '../pages/hospital/HospitalDashboard'
import EmergencyRequest  from '../pages/hospital/EmergencyRequest'
import CampaignManager   from '../pages/hospital/CampaignManager'
import DonorPool         from '../pages/hospital/DonorPool'

// Admin pages
import AdminDashboard       from '../pages/admin/AdminDashboard'
import FacilityVerification from '../pages/admin/FacilityVerification'
import ContentModeration    from '../pages/admin/ContentModeration'
import PlatformHealth       from '../pages/admin/PlatformHealth'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Donor portal */}
        <Route element={<DonorLayout />}>
          <Route path="/donor"               element={<Navigate to="/donor/dashboard" replace />} />
          <Route path="/donor/dashboard"     element={<DonorDashboard />} />
          <Route path="/donor/card"          element={<DonorCard />} />
          <Route path="/donor/notifications" element={<Notifications />} />
          <Route path="/donor/map"           element={<MapView />} />
          <Route path="/donor/profile"       element={<ProfileSettings />} />
        </Route>

        {/* Hospital portal */}
        <Route element={<HospitalLayout />}>
          <Route path="/hospital"           element={<Navigate to="/hospital/dashboard" replace />} />
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
          <Route path="/hospital/emergency" element={<EmergencyRequest />} />
          <Route path="/hospital/campaigns" element={<CampaignManager />} />
          <Route path="/hospital/donors"    element={<DonorPool />} />
        </Route>

        {/* Admin panel */}
        <Route element={<AdminLayout />}>
          <Route path="/admin"                element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard"      element={<AdminDashboard />} />
          <Route path="/admin/verification"   element={<FacilityVerification />} />
          <Route path="/admin/moderation"     element={<ContentModeration />} />
          <Route path="/admin/health"         element={<PlatformHealth />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}