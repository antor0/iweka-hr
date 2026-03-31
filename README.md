# 🏢 HRIS Pro — Human Resource Information System

A **production-grade, full-stack HRIS application** built for Indonesian companies. Features a stunning **Liquid Glass** design system, a complete payroll engine with PPh 21 & BPJS compliance, recruitment (ATS), performance management, and a custom report builder — all powered by **Next.js 15**, **Prisma**, and **PostgreSQL**.

---

## ✨ Screenshots

> Login page and dashboard feature the custom **Liquid Glass** UI with dynamic animated gradient orbs and full light/dark mode support.

---

## 🔑 Default Login Credentials

After running the database seed (`npx prisma db seed`), the following accounts are available:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **System Admin / HR Manager** | `andiko@company.co.id` | `Password123!` | Full access to all modules |

> ⚠️ **Important**: Change this password immediately after your first login in a production environment.

---

## 🗂️ Feature Modules

### Core HR
| Feature | Description |
|---------|-------------|
| **Employee Management** | Full CRUD for employee records: personal data, NIK, NPWP, BPJS numbers, contracts, grade & position assignment |
| **Organization Chart** | Department hierarchy with head-of-department assignment and employee counts |
| **Employment History** | Automatic audit trail on every employee record change (promotions, transfers, status changes) |
| **Role-Based Access Control** | Granular roles: `SYSTEM_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE` |

### Time & Attendance
| Feature | Description |
|---------|-------------|
| **ESS Clock-In/Clock-Out** | Employee Self Service attendance via web with shift detection |
| **Overtime Calculation** | Auto-computed overtime hours per Indonesian labor law |
| **Monthly Attendance Summary** | Aggregated attendance report per employee per pay period |

### Leave Management
| Feature | Description |
|---------|-------------|
| **Leave Requests** | Submit, approve, or reject requests with reason tracking |
| **Leave Balance Enforcement** | Transactional deduction on approval; carry-over support |
| **Leave Types** | Annual (12 days), Sick, Maternity (90 days), Marriage (3 days) |

### Claims / Expense Reimbursement
| Feature | Description |
|---------|-------------|
| **Expense Claims** | Submit reimbursement claims with multiple receipt items |
| **Receipt OCR** | Auto-extract amount and merchant from receipt images using Tesseract.js |
| **Claim Categories** | Travel, Meals, Transport, Parking/Tolls, Accommodation, Office Supplies, Communication |
| **Approval Workflow** | Draft → Submitted → Approved/Rejected → Paid status flow |
| **Running Totals** | Automatic total calculation across all receipt items |

### Payroll Engine
| Feature | Description |
|---------|-------------|
| **Monthly Payroll Run** | Batch calculation engine across all active employees |
| **Grade-Based Base Salary** | Salary ranges defined per grade (Grade I–VI) |
| **BPJS Calculations** | Kesehatan (1%/4%) and Ketenagakerjaan (JHT/JKK/JKM/JP) with salary caps |
| **PPh 21 Tax (TER Method)** | Automated tax calculation using the 2024 TER (Tarif Efektif Rata-rata) method |
| **Payslip Generation** | Per-employee payslip with detailed component breakdown |
| **Accounting Export** | Journal entry and bank transfer file generation |

### Recruitment (ATS)
| Feature | Description |
|---------|-------------|
| **Job Requisitions** | Create and manage approved headcount requests |
| **Candidate Tracking** | Pipeline stages: `NEW → SCREENING → INTERVIEW → OFFER → HIRED` |
| **Analytics Dashboard** | Live metrics: active postings, total candidates, conversion rates |

### Performance Management
| Feature | Description |
|---------|-------------|
| **Performance Cycles** | Configurable review periods (Annual, Mid-Year, Quarterly) |
| **Appraisals** | Manager and self-assessment workflows with status tracking |
| **Goal / KPI Tracking** | Weighted scoring for individual goals with final score aggregation |
| **Performance Dashboard** | Organizational average scores and appraisal completion rates |

### Reports & Analytics
| Feature | Description |
|---------|-------------|
| **Pre-built Reports** | Employee headcount, attendance recap, monthly payslips, PPh 21 return, BPJS SIPP |
| **Custom Report Builder** | Dynamic field selection across Employees, Attendance, Leave, and Payroll datasets |
| **CSV Export** | One-click download of any custom report as a `.csv` file |

### System
| Feature | Description |
|---------|-------------|
| **Audit Logging** | Asynchronous, non-blocking change tracking for all critical operations |
| **JWT Session Management** | HTTP-only secure cookies with 7-day sliding expiry |
| **Settings** | Company profile, theme (light/dark), RBAC configuration |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router, Server Components, Turbopack) |
| **Language** | TypeScript 5 |
| **UI Library** | shadcn/ui + Radix UI primitives |
| **Styling** | Tailwind CSS 4 + custom Liquid Glass design system |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Database** | PostgreSQL |
| **Auth** | `jose` (JWT), `bcryptjs` (password hashing) |
| **Validation** | Zod 4 |
| **OCR** | Tesseract.js (receipt text extraction) |
| **Runtime** | Node.js / Docker |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── attendance/       # Time & attendance
│   │   ├── bpjs/             # BPJS configuration
│   │   ├── employees/        # Employee management
│   │   ├── leave/            # Leave requests
│   │   ├── claims/           # Expense claims & receipts
│   │   ├── organization/     # Department hierarchy
│   │   ├── payroll/          # Payroll runs
│   │   ├── performance/      # KPIs & appraisals
│   │   ├── recruitment/      # Job requisitions & ATS
│   │   ├── reports/          # Reports & custom report builder
│   │   ├── settings/         # System configuration
│   │   └── tax/              # PPh 21 tax
│   ├── api/v1/               # REST API routes
│   │   ├── auth/             # Login / logout / session
│   │   ├── dashboard/        # Aggregate HR stats & activities
│   │   ├── employees/        # Employee CRUD
│   │   ├── attendance/       # Attendance management
│   │   ├── leave/            # Leave management
│   │   ├── claims/           # Claims CRUD & OCR
│   │   ├── payroll/          # Payroll generation
│   │   ├── performance/      # Cycles, appraisals, goals
│   │   ├── recruitment/      # Requisitions & candidates
│   │   └── reports/custom/   # Custom data export
│   └── login/                # Public auth page
├── components/
│   ├── liquid-glass/         # Custom glass UI components
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── auth/                 # session.ts, authService
    ├── db/                   # Prisma singleton (prisma.ts)
    ├── services/             # Business logic layer
    └── validators/           # Zod schemas
prisma/
├── schema.prisma             # Full database schema (25+ models)
├── seed.ts                   # Initial data seeder
└── seed-performance.ts       # Performance module seeder
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** v20+
- **PostgreSQL** 15+ (or Docker)

### 1. Clone & Install

```bash
git clone <repository-url>
cd code
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public"
SESSION_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 3. Database Setup & Seed

```bash
# Push the schema to your database
npx prisma db push

# Seed with initial configuration data (departments, grades, admin user, tax & BPJS config)
npx prisma db seed

# (Optional) Seed with demo performance data
npm run seed:performance
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the credentials from the table above.

---

## 🐳 Production Deployment (Docker)

The application is fully Dockerized using a **multi-stage build** optimized for Next.js standalone output.

### Prerequisites
- Docker Engine
- Docker Compose

### Deploy

The application uses a `DB_MODE` environment variable (set in `docker-compose.yml`) to control database behaviour on each container startup:

| `DB_MODE` | What it does |
|-----------|-------------|
| `migrate` | **(default)** Apply pending migrations + run idempotent seed scripts. Safe for all normal deploys. |
| `reset` | ⚠️ **Destructive** — wipes all data, re-runs migrations from scratch, and seeds a fresh database. |
| `skip` | Skip all DB operations. Fastest option when only app code changed and the DB is healthy. |

**Normal code update (default)**
```bash
# Just build & redeploy — DB_MODE=migrate is the default
docker compose up -d --build
```

**Full database wipe + fresh reseed**
```bash
# Edit docker-compose.yml: set DB_MODE=reset, then:
DB_MODE=reset docker compose up -d --build
```

**Code-only hotfix (skip all DB ops)**
```bash
DB_MODE=skip docker compose up -d --build
```

```bash
# View logs
docker compose logs -f

# Stop all services
npm run docker:down
```

> ⚠️ `DB_MODE=reset` permanently deletes all data. See `deployment-guide.md` for full details.

---

## 🗄️ Database Schema Overview

The Prisma schema contains **25+ models** covering all HRIS domains:

| Domain | Models |
|--------|--------|
| **Core HR** | `Employee`, `Department`, `Position`, `Grade`, `EmploymentHistory` |
| **Auth** | `User`, `AuditLog` |
| **Attendance** | `Attendance`, `Shift` |
| **Leave** | `LeaveType`, `LeaveRequest`, `LeaveBalance` |
| **Claims** | `Claim`, `ClaimItem` |
| **Payroll** | `PayrollRun`, `PayrollItem`, `SalaryComponent`, `EmployeeSalary` |
| **Compliance** | `TaxConfig`, `TaxBracket`, `BpjsConfig` |
| **Recruitment** | `JobRequisition`, `Candidate`, `Application`, `Interview` |
| **Performance** | `PerformanceCycle`, `Appraisal`, `Goal` |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1/` and require a valid session cookie (except auth).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate and create session |
| `POST` | `/auth/logout` | Invalidate session |
| `GET/POST` | `/employees` | List / create employees |
| `GET/PUT/DELETE` | `/employees/:id` | Get / update / delete employee |
| `GET/POST` | `/attendance` | List / clock-in attendance |
| `PUT` | `/attendance/:id/clock-out` | Clock out |
| `GET/POST` | `/leave/requests` | List / submit leave requests |
| `PUT` | `/leave/requests/:id/status` | Approve or reject a request |
| `POST` | `/payroll/generate` | Trigger a payroll run |
| `PUT` | `/payroll/runs/:id/approve` | Approve payroll batch |
| `GET/POST` | `/performance/cycles` | List / create performance cycles |
| `GET/POST` | `/performance/appraisals` | List / create appraisals |
| `PUT` | `/performance/appraisals/:id/status` | Update appraisal score/status |
| `POST` | `/performance/appraisals/:id/goals` | Add goals to an appraisal |
| `PUT` | `/performance/goals/:id` | Update a goal rating |
| `GET/POST` | `/recruitment/requisitions` | List / create job postings |
| `POST` | `/reports/custom` | Generate a custom data export |
| `GET/POST` | `/claims` | List / create expense claims |
| `GET/PATCH` | `/claims/:id` | Get claim detail / submit / approve / reject |
| `POST` | `/claims/:id/items` | Add receipt item with image upload + OCR |
| `DELETE` | `/claims/:id/items/:itemId` | Remove receipt item |
| `POST` | `/claims/ocr` | Standalone OCR on a receipt image |

---

## 🇮🇩 Indonesian Compliance

This system is purpose-built for Indonesian labor law compliance:

- **PPh 21 TER Method** (Tarif Efektif Rata-rata) — 2024 regulation
- **BPJS Kesehatan**: 1% employee / 4% employer, capped at Rp 12.000.000
- **BPJS Ketenagakerjaan**: JHT, JKK, JKM, JP with 2024 salary caps
- **PTKP Brackets**: TK/0–3 and K/0–3 status support
- **Leave Entitlements**: 12-day annual leave, Maternity (90 days), and more per UU No. 13/2003

---

## 📋 Available Scripts

```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

npm run docker:up       # Start Docker containers
npm run docker:down     # Stop Docker containers

npx prisma db seed      # Seed initial data
npm run seed:performance # Seed performance demo data
npx prisma studio       # Open Prisma database GUI
```

---

## 📄 License

This project is proprietary software developed for **Indowebhost Kreasi**. All rights reserved.
