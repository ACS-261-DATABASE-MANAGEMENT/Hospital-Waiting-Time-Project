# 🏥 Hospital Waiting Time Dashboard

**ACS-261 Database Management Systems — Citizen-Generated Data (CGD) Project**
Daystar University | Lukenya Area Health Facilities

A full-stack web application that lets patients anonymously submit structured timestamps about their hospital visits, computes wait times per stage, and displays interactive analytics dashboards.

---

## 🗺️ Project Structure

```
Hospital-Waiting-Time-Project/
├── backend/
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL DDL (tables, trigger, views)
│   │   ├── seed.sql            # 5 facilities, 11 depts, ~155 synthetic visits
│   │   └── example_queries.sql # 13 SQL queries for assignment report
│   ├── controllers/
│   │   ├── facilitiesController.js
│   │   ├── visitsController.js
│   │   ├── dashboardController.js
│   │   └── exportController.js
│   ├── middleware/
│   │   ├── validate.js         # express-validator rules
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── facilities.js
│   │   ├── visits.js
│   │   ├── dashboard.js
│   │   └── export.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js       # Axios instance
│   │   │   └── api.js          # All API call functions
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── StarRating.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ReportForm.jsx  # Patient visit submission
│   │   │   ├── Dashboard.jsx   # Recharts analytics
│   │   │   └── AdminTable.jsx  # Filterable admin table
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Full design system
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Prerequisites

- **PostgreSQL** 14+ (`psql` in PATH)
- **Node.js** 18+ and npm 9+
- A PostgreSQL superuser or user with CREATE DATABASE privileges

---

## 🚀 Quick Start

### 1 — Create the Database

```bash
# Using the default postgres user
createdb -U postgres hospital_wait_db

# Or via psql
psql -U postgres -c "CREATE DATABASE hospital_wait_db;"
```

### 2 — Run Schema Migrations

```bash
cd backend

# Apply schema (tables, trigger, views, indexes)
psql -U postgres -d hospital_wait_db -f db/schema.sql

# Seed with 5 facilities, 11 departments, ~155 synthetic visits
psql -U postgres -d hospital_wait_db -f db/seed.sql
```

### 3 — Configure Backend Environment

```bash
cp .env.example .env
# Edit .env and set your DB credentials:
nano .env
```

`.env` contents:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_wait_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=4000
FRONTEND_URL=http://localhost:5173
```

### 4 — Start the Backend

```bash
cd backend
npm install
npm run dev      # Starts with nodemon on port 4000
# OR
npm start        # Production start
```

Backend will print: `✅ Hospital Wait Time API running on http://localhost:4000`

### 5 — Start the Frontend

```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on port 5173
```

Open **http://localhost:5173** in your browser.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/facilities` | List all facilities with departments |
| `POST` | `/api/facilities` | Create a new facility (admin) |
| `POST` | `/api/visits` | Submit a new visit report |
| `GET` | `/api/visits` | List/filter visits (facility_id, date range, payment_type, status, page) |
| `PATCH` | `/api/visits/:id/status` | Update visit review status |
| `GET` | `/api/dashboard/summary` | Aggregated stats for charts |
| `GET` | `/api/dashboard/by-department` | Wait times by department |
| `GET` | `/api/export/csv` | Download filtered visits as CSV |

---
///
UNF
PatientID
PatientName
Doctor
Department
AppointmentDate
ArrivalTime
ConsultationStart
WaitingMinutes
Rating
1
John Mwangi
Dr. Kim
Outpatient
2026-07-20
08:00
08:40
40
5

1NF
AppointmentID
PatientID
PatientName
DoctorID
DoctorName
Department
AppointmentDate
ArrivalTime
ConsultationStart
WaitingMinutes
Rating
101
1
John Mwangi
1
Dr. Kim
Outpatient
2026-07-20
08:00
08:40
40
5

2NF - Patients
PatientID
FullName
Gender
Phone
Email
1
John Mwangi
Male
0711111111
john@example.com

2NF - Doctors
DoctorID
FullName
DepartmentID
1
Dr. Kim
1

2NF - Appointments
AppointmentID
PatientID
DoctorID
AppointmentDate
Status
101
1
1
2026-07-20
Completed

3NF - Departments
DepartmentID
DepartmentName
1
Outpatient
2
Emergency

3NF - Patients
PatientID
FullName
Gender
DateOfBirth
Phone
Email
1
John Mwangi
Male
2002-04-15
0711111111
john@example.com

3NF - Doctors
DoctorID
FullName
Specialization
DepartmentID
1
Dr. Kim
General Medicine
1

3NF - Appointments
AppointmentID
PatientID
DoctorID
AppointmentDate
AppointmentTime
Status
101
1
1
2026-07-20
08:30
Completed

3NF - WaitingTimes
WaitingID
AppointmentID
ArrivalTime
ConsultationStart
WaitingMinutes
1
101
08:00
08:40
40

3NF - Feedback
FeedbackID
PatientID
WaitingID
Rating
Comments
1
1
1
5






## 🗄️ Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `facilities` | Health facilities (hospital, clinic, dispensary, health_centre) |
| `departments` | Departments within each facility |
| `visits` | Core CGD table — one row per anonymous visit report |
| `visit_flags` | Audit log of duplicate/quality flags |

### Views

| View | Purpose |
|------|---------|
| `vw_wait_stage_summary` | Per-visit wait in minutes (triage, consult, pharmacy, total) |
| `vw_facility_daily_summary` | Aggregated averages per facility × day-of-week |

### Trigger

`trg_flag_duplicate_visit` — fires `AFTER INSERT` on `visits`. Detects when the same `patient_token + facility_id + visit_date` combination already exists and automatically sets `status = 'flagged_duplicate'` plus inserts a `visit_flags` record.

---

## 📊 Example SQL Queries

See [`backend/db/example_queries.sql`](backend/db/example_queries.sql) for 13 queries covering:

- Simple joins across 3 tables
- `GROUP BY` with aggregates (AVG, COUNT, ROUND)
- `HAVING` filters on aggregates
- Correlated subqueries
- `EXISTS` subqueries
- Derived table subqueries in FROM
- Window functions (RANK, rolling AVG)
- CTEs for rolling 7-day trends
- Multi-condition `WHERE` clauses
- Querying views

---

## 🧪 Test the API Manually

```bash
# Health check
curl http://localhost:4000/api/health

# List facilities
curl http://localhost:4000/api/facilities

# Submit a visit
curl -X POST http://localhost:4000/api/visits \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": 1,
    "department_id": 1,
    "visit_date": "2025-07-22",
    "payment_type": "cash",
    "arrival_time": "2025-07-22T08:00:00+03:00",
    "consultation_called_time": "2025-07-22T08:45:00+03:00",
    "consultation_end_time": "2025-07-22T09:10:00+03:00",
    "medication_received_time": "2025-07-22T09:30:00+03:00",
    "satisfaction_rating": 4
  }'

# Dashboard summary
curl http://localhost:4000/api/dashboard/summary

# Export CSV
curl "http://localhost:4000/api/export/csv?payment_type=insurance" -o visits.csv
```

---

## 🎨 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with project overview |
| Report Form | `/report` | Patient-facing visit submission form |
| Dashboard | `/dashboard` | Charts and analytics (Recharts) |
| Admin | `/admin` | Filterable table with status updates |

---

## 🔧 Troubleshooting

**`ECONNREFUSED` connecting to DB**
→ Ensure PostgreSQL is running: `sudo service postgresql start`

**`role "postgres" does not exist`**
→ Create the role: `sudo -u postgres psql -c "CREATE ROLE postgres SUPERUSER LOGIN;"`

**Port 4000 already in use**
→ Change `PORT=` in `backend/.env`

**Frontend can't reach API**
→ The Vite dev proxy (`/api → localhost:4000`) handles this automatically. Make sure the backend is running.

---

## 📋 Assignment Deliverables Checklist

- [x] PostgreSQL schema with PK/FK, CHECK, NOT NULL, ON DELETE rules
- [x] Duplicate-detection trigger with `visit_flags` audit table
- [x] `vw_wait_stage_summary` view (triage, consult, pharmacy, total)
- [x] `vw_facility_daily_summary` view (avg per facility × day)
- [x] Seed data: 5 facilities, 11 departments, ~155 visits
- [x] REST API: POST /visits, GET /visits, GET /facilities, dashboard endpoints, CSV export
- [x] Input validation (express-validator), error middleware, CORS
- [x] React frontend: Report Form, Dashboard (4 chart types), Admin table
- [x] Navigation bar with active states
- [x] 13 example SQL queries (joins, GROUP BY/HAVING, subqueries, CTEs, windows)
- [x] Monorepo structure with clear README setup instructions

---

## Conclusion
A data-driven dashboard that collects and analyzes patient-reported hospital waiting times to identify service bottlenecks and improve healthcare delivery. Adding a conclusion section to the report.
