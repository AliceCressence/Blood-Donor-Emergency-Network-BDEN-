// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout   from '../components/layout/PublicLayout'
import DonorLayout    from '../components/layout/DonorLayout'
import HospitalLayout from '../components/layout/HospitalLayout'
import AdminLayout    from '../components/layout/AdminLayout'

// Public
import LandingPage  from '../pages/public/LandingPage'
import CampaignsPage from '../pages/public/CampaignsPage'
import MythsPage from '../pages/public/MythsPage'
import NotFoundPage from '../pages/public/NotFoundPage'

// Auth
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import GoogleCallback from '../pages/auth/GoogleCallback'

import ProtectedRoute from './ProtectedRoute'

// Donor pages
import DonorDashboard  from '../pages/donor/Dashboard'
import DonorCard       from '../pages/donor/DonorCard'
import Notifications   from '../pages/donor/Notifications'
import MapView         from '../pages/donor/MapView'
import DonorProfile    from '../pages/donor/DonorProfile'
import RequestDetail   from '../pages/donor/RequestDetail'

// Hospital pages
import HospitalDashboard from '../pages/hospital/HospitalDashboard'
import EmergencyRequest  from '../pages/hospital/EmergencyRequest'
import CampaignManager   from '../pages/hospital/CampaignManager'
import DonorPool         from '../pages/hospital/DonorPool'
import HospitalProfile   from '../pages/hospital/HospitalProfile'

// Admin pages
import AdminDashboard       from '../pages/admin/AdminDashboard'
import FacilityVerification from '../pages/admin/FacilityVerification'
import CampaignReview       from '../pages/admin/CampaignReview'
import ContentModeration    from '../pages/admin/ContentModeration'
import MythEditor           from '../pages/admin/MythEditor'
import PlatformHealth       from '../pages/admin/PlatformHealth'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/myths" element={<MythsPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Donor portal */}
        <Route element={<ProtectedRoute allowedRoles={['donor']} />}>
          <Route element={<DonorLayout />}>
            <Route path="/donor"               element={<Navigate to="/donor/dashboard" replace />} />
            <Route path="/donor/dashboard"     element={<DonorDashboard />} />
            <Route path="/donor/card"          element={<DonorCard />} />
            <Route path="/donor/notifications" element={<Notifications />} />
            <Route path="/donor/map"           element={<MapView />} />
            <Route path="/donor/requests/:id"  element={<RequestDetail />} />
            <Route path="/donor/profile"       element={<DonorProfile />} />
          </Route>
        </Route>

        {/* Hospital portal */}
        <Route element={<ProtectedRoute allowedRoles={['hospital']} />}>
          <Route element={<HospitalLayout />}>
            <Route path="/hospital"           element={<Navigate to="/hospital/dashboard" replace />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/emergency" element={<EmergencyRequest />} />
            <Route path="/hospital/campaigns" element={<CampaignManager />} />
            <Route path="/hospital/donors"    element={<DonorPool />} />
            <Route path="/hospital/profile"   element={<HospitalProfile />} />
          </Route>
        </Route>

        {/* Admin panel */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"              element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard"    element={<AdminDashboard />} />
            <Route path="/admin/verification" element={<FacilityVerification />} />
            <Route path="/admin/campaigns"    element={<CampaignReview />} />
            <Route path="/admin/myths"        element={<MythEditor />} />
            <Route path="/admin/moderation"   element={<ContentModeration />} />
            <Route path="/admin/health"       element={<PlatformHealth />} />
          </Route>
        </Route>

        {/* 404 — catches any unknown URL */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  )
}
