# 🩸 BDEN — Blood Donor Emergency Network

> Connecting donors, hospitals, and communities to make life-saving blood available when and where it matters most.

---

## What is BDEN?

BDEN is a web platform built for sub-Saharan Africa — starting with Cameroon — that solves a critical problem: during a medical emergency, finding compatible blood donors fast is nearly impossible through traditional means.

BDEN bridges that gap by connecting:
- **Voluntary donors** who register their blood type and availability
- **Hospitals** that post emergency blood requests in real time
- **Communities** that can follow campaigns and spread awareness

---

## Features

### Donor Portal
- Dashboard with donation stats, eligibility tracker, and live emergency requests nearby
- Virtual donor card with blood type, QR verification code, and donor ID
- Real-time notifications for emergencies, campaigns, and eligibility reminders
- Interactive map (Leaflet) showing nearby hospitals, campaigns, and emergency requests
- Profile settings with notification preferences and privacy controls

### Hospital Portal *(Phase 5 — in progress)*
- Post emergency blood requests with urgency level and blood type
- Manage donation campaigns
- View donor pool statistics by blood type and city

### Admin Panel *(Phase 6 — planned)*
- Facility verification
- Content moderation
- Platform health monitoring

### Public Pages
- Landing page with live emergency request preview
- Myth debunking module (WHO-sourced)
- Campaign browser with Leaflet map

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Maps | Leaflet + React-Leaflet |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Auth (mock) | Context API + localStorage |
| API (planned) | Axios + Node.js backend |
| Real-time (planned) | Socket.io |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Installation

```bash
git clone https://github.com/AliceCressence/Blood-Donor-Emergency-Network-BDEN-.git
cd Blood-Donor-Emergency-Network-BDEN-
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # Button, Badge, Card, Input, Spinner...
│   ├── layout/      # Navbar, PublicLayout, DonorLayout
│   └── shared/      # Shared widgets
├── pages/
│   ├── public/      # LandingPage
│   ├── auth/        # Login, Register
│   ├── donor/       # Dashboard, DonorCard, Notifications, MapView, ProfileSettings
│   ├── hospital/    # (Phase 5)
│   └── admin/       # (Phase 6)
├── context/         # AuthContext
├── services/        # auth.service.js
├── hooks/           # Custom hooks
├── router/          # AppRouter, ProtectedRoute
└── utils/           # Helpers and constants
```

---

## Build Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Design system, components, routing | ✅ Complete |
| 2 | Landing page | ✅ Complete |
| 3 | Auth — Login & Register | ✅ Complete |
| 4 | Donor portal | ✅ Complete |
| 5 | Hospital portal | 🔨 In progress |
| 6 | Admin panel | ⏳ Planned |
| 7 | AI chatbot, WebSockets, polish | ⏳ Planned |

---

## Design System

- **Primary color:** Blood red `#dc2626`
- **Fonts:** Syne (display), DM Sans (body), JetBrains Mono (code/blood types)
- **Background:** Warm cream `#faf9f7`
- **Dark surfaces:** `#0a0a0a` / `#171717`

---

## Context

This project is being developed as a real-world solution to blood access challenges in Cameroon. The platform is designed to be inclusive — donors who don't know their blood type can still register and participate while being guided to get tested at a partner facility.

---

## Author

**Alice Cressence**  
GitHub: [@AliceCressence](https://github.com/AliceCressence)

---

*BDEN — Because every second counts.*