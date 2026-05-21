# 🩸 BDEN — Blood Donor Emergency Network

> Connecting donors, hospitals, and communities to make 
> life-saving blood available when and where it matters most.

---

## The Problem

In many regions across sub-Saharan Africa, including Cameroon, 
access to blood during a medical emergency is not primarily a 
supply problem — it is a **coordination and trust problem.**

When a patient arrives at a hospital needing an urgent 
transfusion, the clock starts ticking. But instead of a digital 
registry, what exists is a phone tree. Families are sent into 
the streets to find a compatible donor. Hospitals organize 
donation campaigns through flyers and word of mouth, with no 
way to measure impact or build donor loyalty. And millions of 
people who would willingly donate never do — because they don't 
know their blood type, because they've heard it will make them 
sick or weak, or simply because no one ever made it easy enough 
to start.

**Three barriers stand between willing donors and patients who 
need them:**

- 🚨 **No fast matching system** for emergencies — locating a 
  compatible donor nearby takes hours that patients don't have
- 📋 **No structured campaign infrastructure** — hospitals can't 
  efficiently organize, publicize, or measure donation drives, 
  and donors have no reason to return
- 🚪 **High entry barriers** — unknown blood types, cultural 
  myths, and no perceived personal benefit keep potential donors 
  from ever registering

---

## The Solution

**BDEN** is a web-based platform built specifically for this 
context. It operates across three interconnected modules:

### 🚨 Emergency Response
Verified hospitals and health centers post urgent blood requests 
specifying blood type, urgency level, and location. The platform 
instantly matches and notifies compatible registered donors 
within a configurable geographic radius. Donors respond directly 
through the platform, and hospitals track request status in 
real time on their dashboard.

### 📋 Campaign Management
Health facilities can plan and publish upcoming blood donation 
drives — specifying needed blood types, collection targets, 
dates, and crucially, **what they offer donors in return**: 
loyalty cards, free or discounted medical exams, priority access 
during emergencies. Progress is tracked transparently (number 
of donors, volume collected) without exposing donor identities. 
Campaigns require admin verification to ensure only legitimate, 
legally operating facilities can organize them.

### 🪪 Virtual Donor Card
Every registered donor builds a verified donation history. The 
card enforces medically safe donation intervals (minimum 3 months 
apart, minimum 350ml per session) and serves as proof of 
contribution when claiming hospital-offered benefits. Regular 
donors become recognized members of their facility's donor 
community — turning a one-time act into an ongoing relationship.

### 🩺 Inclusive Onboarding
Blood type is not a hard requirement to join. New donors who 
don't know their type go through an AI-assisted estimation flow 
based on family history and prior medical interactions, receive 
an honest probability estimate, and are guided to nearby 
screening centers to get confirmed. Verified and unverified 
donors coexist in the system — no one is turned away, and 
everyone is progressively guided toward full participation.

### 🗺️ Location-Aware Features
An interactive map (powered by OpenStreetMap / Leaflet.js) helps 
donors discover nearby campaigns, helps hospitals set their 
location by dropping a pin (critical in areas without formal 
street addresses), and helps unverified donors find the closest 
screening facility. Donor real-time locations are never exposed 
— privacy is a core design principle.

### 💬 Myth Debunking Module
A public, no-login-required resource that directly addresses the 
most common cultural and medical misconceptions about blood 
donation — grounded in WHO guidelines. Because education is the 
first step to participation.

---

## Who This Is For

| Actor | Role on the Platform |
|---|---|
| **Voluntary Donors** | Register, set availability, respond to alerts, build donation history |
| **Hospitals & Health Centers** | Post emergency requests, organize campaigns, declare donor benefits |
| **Admins** | Verify facility accounts, moderate content, monitor platform health |
| **General Public** | Browse campaigns, read myth-debunking content, get motivated to register |

---

## Architecture Overview

BDEN is built on a **microservices architecture**, with the 
following core services:

| Service | Responsibility |
|---|---|
| `auth-service` | Registration, login, JWT, role management |
| `donor-service` | Donor profiles, blood type, location, availability, donor card |
| `request-service` | Emergency request lifecycle and donor matching |
| `campaign-service` | Campaign creation, verification, progress tracking |
| `notification-service` | Email and in-app alerts |
| `api-gateway` | Routing, rate limiting, single entry point |

---

## Tech Stack

> Full stack details available in `/docs/architecture.md`

- **Frontend:** React.js
- **Backend Services:** Node.js / Express (or your chosen stack)
- **Database:** PostgreSQL + Redis (caching & session)
- **Maps:** Leaflet.js + OpenStreetMap
- **Notifications:** Nodemailer (email) + WebSockets (in-app)
- **AI Feature:** Claude API (blood type estimation chatbot)
- **Infrastructure:** Docker + Kubernetes
- **CI/CD:** Jenkins
- **Monitoring:** Prometheus + Grafana
- **IaC:** Ansible

---

## Getting Started
```bash
# Clone the repository
git clone https://github.com/your-org/bden.git
cd bden

# Start all services with Docker Compose (development)
docker-compose up --build
```

> Full setup instructions, environment variables, and 
> contribution guidelines are in [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## API Documentation

Interactive API docs available via Swagger at:
`http://localhost:8080/api-docs` (when running locally)

Or view the hosted Postman collection: `[link here]`

---

## Project Status

🚧 **In active development** — Spring 2026 academic project  
Course: SEN3244 Software Architecture — ICT University

---

## License

MIT License. See [`LICENSE`](./LICENSE) for details.
