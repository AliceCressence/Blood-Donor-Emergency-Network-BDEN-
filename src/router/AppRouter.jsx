// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout   from '../components/layout/PublicLayout'
import DonorLayout    from '../components/layout/DonorLayout'
import HospitalLayout from '../components/layout/HospitalLayout'

// Public pages
import LandingPage from '../pages/public/LandingPage'

// Auth pages
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Donor pages
import DonorDashboard from '../pages/donor/DonorDashboard'
import DonorCard      from '../pages/donor/DonorCard'
import DonorProfile   from '../pages/donor/DonorProfile'
import NearbyMap      from '../pages/donor/NearbyMap'

// Hospital pages
import HospitalDashboard from '../pages/hospital/HospitalDashboard'
import EmergencyRequest  from '../pages/hospital/EmergencyRequest'
import CampaignManager   from '../pages/hospital/CampaignManager'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Auth */}
        <Route path="login"    element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Donor portal */}
        <Route element={<DonorLayout />}>
          <Route path="donor"         element={<DonorDashboard />} />
          <Route path="donor/card"    element={<DonorCard />} />
          <Route path="donor/profile" element={<DonorProfile />} />
          <Route path="donor/map"     element={<NearbyMap />} />
        </Route>

        {/* Hospital portal */}
        <Route element={<HospitalLayout />}>
          <Route path="hospital"           element={<HospitalDashboard />} />
          <Route path="hospital/emergency" element={<EmergencyRequest />} />
          <Route path="hospital/campaigns" element={<CampaignManager />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
