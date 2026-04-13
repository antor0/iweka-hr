# 🏢 HRIS Pro — Human Resource Information System

A **production-grade, full-stack HRIS application** built for Indonesian companies. Features a stunning **Liquid Glass** design system, a complete payroll engine with PPh 21 & BPJS compliance, recruitment (ATS), performance management, a custom report builder, an official letter (surat) system with PDF support, and a real-time notification system with email integration — all powered by **Next.js 16**, **Prisma 7**, and **PostgreSQL**.

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

### Organization Settings *(New in v0.5)*
| Feature | Description |
|---------|-------------|
| **Locations** | Manage company branches and office locations; assign to departments and employees |
| **Work Time Models** | Configure Regular, 2-Shift, or 3-Shift schedules with per-shift start/end/break times |
| **Approval Workflows** | Map Level-1 and Level-2 approvers per department per request type; 2-level enforced for budgeting |
| **Grade per Position** | Associate one or more salary grades to each organizational position |
| **Work Schedule** | Department-level shift generation (Regular & Shift models) with automatic round-robin rotation |
| **Timesheet Collation** | Automated schedule-vs-actual attendance collation; identifies Late, Absent, Present, and Holiday status |

### Employee Salary Detail *(New in v0.5)*
| Feature | Description |
|---------|-------------|
| **Tunjangan Tetap** | Fixed monthly allowances (Tunjangan Jabatan, Harian, etc.) configurable per employee |
| **Tunjangan Harian (Absensi-Based)** | Daily allowance computed from actual attendance days present |
| **Monthly Variable Inputs** | HR inputs THR, Lembur, Komisi, and Bonus amounts monthly before payroll is run |
| **Payroll Engine Integration** | `generatePayroll` reads live allowances and variable inputs from DB — no hardcoded values |

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
| **Dynamic Allowances** | Reads employee allowances (fixed & attendance-based) live from DB per payroll run |
| **Variable Pay** | THR, overtime, bonus, and commission pulled from monthly variable inputs |
| **BPJS Calculations** | Kesehatan (1%/4%) and Ketenagakerjaan (JHT/JKK/JKM/JP) with salary caps |
| **PPh 21 Tax (TER Method)** | Automated tax calculation using the 2024 TER (Tarif Efektif Rata-rata) method |
| **Payslip Generation** | Per-employee payslip with detailed component breakdown |
| **Accounting Export** | Journal entry and bank transfer file generation |

### Surat (Official Letters) *(New in v0.5)*
| Feature | Description |
|---------|-------------|
| **14 Letter Types** | SP1/SP2/SP3, Pengangkatan, Promosi, Demosi, Mutasi, Pemberhentian, Pengunduran Diri, Purchase Request, Tugas, Keterangan Penghasilan, Paklaring, Keterangan Kerja |
| **HTML Template Editor** | Full raw HTML editing of letter content via a split-pane management UI |
| **Auto-Numbering** | Configurable format string (e.g. `{{seq}}/{{month}}/TYPE/HR/{{year}}`); month in Roman numerals |
| **Placeholder Compilation** | Employee name, NIK, position, department, hire date, reason auto-injected on generation |
| **Surat History** | Per-employee letter history with full generated HTML stored in DB |
| **Print / PDF Export** | Opens compiled letter in a new browser tab for native print-to-PDF |

### Notifications & Email *(New in v0.5)*
| Feature | Description |
|---------|-------------|
| **In-App Notification Bell** | Live-polling bell icon in Topbar with unread count badge and type color-coding |
| **Mark Read / Mark All Read** | Per-item or bulk acknowledgement of notifications |
| **Nodemailer SMTP Email** | Sends HTML-formatted emails via configurable SMTP (Gmail, Mailtrap, custom) |
| **Approval Email Templates** | Pre-built HTML email for approval requests (to approver) and status updates (to requester) |
| **Email Settings UI** | Full SMTP configuration form at `/settings/email` with live test-send |

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
| **Platform User Management** | Full CRUD for system users with optional mapping to internal Employee profiles |
| **Role-Based Access Control** | Granular matrix-based authorization securing both API endpoints and conditional UI sidebar tabs |
| **JWT Session Management** | HTTP-only secure cookies with 7-day sliding expiry |
| **Settings** | Company profile, theme (light/dark), RBAC configuration, SMTP email config |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Server Components, Turbopack) |
| **Language** | TypeScript 5 |
| **UI Library** | shadcn/ui + Radix UI primitives |
| **Styling** | Tailwind CSS 4 + custom Liquid Glass design system |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Database** | PostgreSQL |
| **Auth** | `jose` (JWT), `bcryptjs` (password hashing) |
| **Validation** | Zod 4 |
| **Email** | Nodemailer (SMTP — Gmail, Mailtrap, custom) |
| **PDF/Print** | Browser native `print()` via compiled HTML templates |
| **OCR** | Tesseract.js (receipt text extraction) |
| **Runtime** | Node.js / Docker |

---

## 🎨 UI/UX & Design Standards

To maintain the project's signature **Liquid Glass** aesthetic, all new features must adhere to:

*   **Tailwind CSS 4**: Utilize the new `@theme` system and OKLCH color space.
*   **Glassmorphism**: Use `.glass`, `.glass-hover`, and `.glass-lg` utility classes.
*   **Color Persistence**: Always use CSS variables (tokens) from `globals.css` instead of raw hex codes.
*   **Micro-animations**: Implement `animate-fade-in` and `animate-slide-up` for new page elements to ensure a premium feel.
*   **Dark Mode**: Every component must be tested and fully functional in both light and dark themes using the standard token set.

---

## 🔐 RBAC & Security Maintenance

To maintain the security of the platform when building new features:

1.  **Permission Keys**: All permission strings are centralized in `src/lib/auth/permissions-config.ts`.
2.  **Server Propagation**: Use `requirePermission(session, 'permission.key')` in all API routes.
3.  **Client Propagation**: Use `hasPermission(role, 'permission.key')` for UI-level filtering (e.g., in the sidebar).
4.  **Admin UI**: Ensure any new module is added to `PERMISSION_GROUPS` in `permissions-config.ts` so it appears in the **Settings > Roles & Permissions** matrix.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── organization/
│   │   │   ├── departments/
│   │   │   │   └── [id]/
│   │   │   │       ├── components/   # Dept detail components
│   │   │   │       │   ├── schedule-card.tsx
│   │   │   │       │   ├── timesheet-card.tsx
│   │   │   │       │   └── work-models-card.tsx
│   │   │   │       └── page.tsx      # Reorganized hierarchical layout
│   │   │   └── page.tsx
│   │   ├── payroll/          # Payroll runs
│   │   ├── performance/      # KPIs & appraisals
│   │   ├── recruitment/      # Job requisitions & ATS
│   │   ├── reports/          # Reports & custom report builder
│   │   ├── settings/
│   │   │   ├── holidays/     # National holiday management
│   │   │   ├── email/        # SMTP email configuration UI
│   │   │   ├── users-tab.tsx # Component for Platform Users CRUD
│   │   │   └── page.tsx      # Settings multi-tab layout
│   │   ├── surat-templates/  # Letter template HTML editor
│   │   └── tax/              # PPh 21 tax
│   ├── api/v1/               # REST API routes
│   │   ├── departments/      # Department-specific operations
│   │   │   └── [id]/
│   │   │       ├── schedule/    # Schedule generation & override
│   │   │       └── timesheet/   # Timesheet collation
│   │   │       └── work-models/ # Work model assignment
│   │   ├── organization/     # Global organization settings
│   │   │   ├── locations/
│   │   │   ├── work-time-models/
│   │   │   ├── approval-workflows/
│   │   │   └── position-grades/
│   │   ├── auth/             # Login / logout / session
│   │   ├── dashboard/        # Aggregate HR stats & activities
│   │   ├── ess/              # ESS-specific endpoints (PWA)
│   │   ├── payroll/          # Payroll generation
│   │   ├── performance/      # Cycles, appraisals, goals
│   │   ├── recruitment/      # Requisitions & candidates
│   │   ├── reports/custom/   # Custom data export
│   │   ├── settings/email/   # EmailConfig CRUD & test
│   │   └── surat/templates/  # Surat template management
│   └── login/                # Public auth page
├── components/
│   ├── layout/
│   │   ├── notification-bell.tsx  # Live notification dropdown
│   │   ├── topbar.tsx
│   │   └── sidebar.tsx
│   ├── liquid-glass/         # Custom glass UI components
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── auth/                 # session.ts, authService
    ├── db/                   # Prisma singleton (prisma.ts)
    ├── services/
    │   ├── email.service.ts          # Nodemailer SMTP wrapper
    │   ├── notification.service.ts   # In-app + email notifications
    │   ├── organization.service.ts   # Locations, work models, workflows
│   │   ├── department.service.ts     # Department-specific logic
│   │   ├── schedule.service.ts       # Round-robin shift generation
│   │   ├── timesheet.service.ts      # Attendance vs Schedule collation
    │   ├── salary.service.ts         # Allowances & variable inputs
    │   └── surat.service.ts          # Template compilation & history
    └── validators/
        ├── organization.schema.ts
        ├── salary.schema.ts
        └── surat.schema.ts
prisma/
├── schema.prisma             # Full database schema (37+ models)
├── seed.ts                   # Initial data seeder
├── seed-features.ts          # Feature expansion seeder (locations, work models, surat templates, email config)
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

# Optional — used only if you want a fixed SMTP config at env level
# SMTP settings can also be configured at runtime via /settings/email in the UI
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_NAME="HRIS System"
SMTP_FROM_EMAIL="your-email@gmail.com"
```

### 3. Database Setup & Seed

```bash
# Apply migrations to your database
npx prisma migrate dev

# Seed with initial configuration data (departments, grades, admin user, tax & BPJS config)
npx prisma db seed

# Seed new feature data (locations, work time models, surat templates, email config)
npm run seed:features

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

The Prisma schema contains **37+ models** covering all HRIS domains:

| Domain | Models |
|--------|--------|
| **Core HR** | `Employee`, `Department`, `Position`, `Grade`, `EmploymentHistory`, `FamilyMember` |
| **Organization** | `Location`, `WorkTimeModel`, `WorkTimeSchedule`, `ApprovalWorkflow`, `PositionGrade` |
| **Salary** | `EmployeeAllowance`, `MonthlyVariableInput` |
| **Auth** | `User`, `AuditLog` |
| **Attendance** | `Attendance`, `Shift` |
| **Leave** | `LeaveType`, `LeaveRequest`, `LeaveBalance` |
| **Claims** | `Claim`, `ClaimItem` |
| **Payroll** | `PayrollRun`, `PayrollItem`, `SalaryComponent`, `EmployeeSalary` |
| **Compliance** | `TaxConfig`, `TaxBracket`, `BpjsConfig` |
| **Recruitment** | `JobRequisition`, `Candidate`, `Application`, `Interview` |
| **Performance** | `PerformanceCycle`, `Appraisal`, `Goal` |
| **Surat** | `SuratTemplate`, `SuratHistory` |
| **Notifications** | `Notification`, `EmailConfig` |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1/` and require a valid session cookie (except auth).

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate and create session |
| `POST` | `/auth/logout` | Invalidate session |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/employees` | List / create employees |
| `GET/PUT/DELETE` | `/employees/:id` | Get / update / delete employee |
| `GET/POST` | `/employees/:id/allowances` | List / create allowances (tunjangan) |
| `PUT/DELETE` | `/employees/:id/allowances/:allowanceId` | Update / delete a single allowance |
| `GET/POST` | `/employees/:id/variable-inputs` | List / upsert monthly variable pay |
| `GET/POST` | `/employees/:id/surat` | List surat history / generate new letter |

### Organization
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/organization/locations` | List / create office locations |
| `PUT/DELETE` | `/organization/locations/:id` | Update / delete a location |
| `GET/POST` | `/organization/work-time-models` | List / create work time models |
| `PUT/DELETE` | `/organization/work-time-models/:id` | Update / delete a work time model |
| `GET/POST` | `/organization/approval-workflows` | List / upsert approval workflows |
| `DELETE` | `/organization/approval-workflows/:id` | Delete a workflow |
| `GET/POST` | `/organization/position-grades` | List positions with grades / upsert grade mapping |
| `GET/POST` | `/departments/:id/schedule` | Get / generate work schedules |
| `GET/POST` | `/departments/:id/timesheets` | Get / collate timesheets |
| `POST` | `/departments/:id/work-models` | Assign work models to department employees |

### Surat Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/surat/templates` | List all surat templates |
| `GET/PUT` | `/surat/templates/:id` | Get / update a template |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Paginated list + unread count for current user |
| `POST` | `/notifications/:id/read` | Mark a single notification as read |
| `POST` | `/notifications/mark-all-read` | Mark all notifications as read |

### Settings & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/PUT` | `/settings/email` | Get / create / update SMTP email configuration |
| `POST` | `/settings/email/test` | Send a live test email via configured SMTP |
| `GET/POST` | `/settings/users` | List all platform users / create new user |
| `PUT/DELETE` | `/settings/users/:id` | Update / delete platform user |
| `POST` | `/settings/users/:id/reset-password` | Force reset a user's password |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/attendance` | List / clock-in attendance |
| `PUT` | `/attendance/:id/clock-out` | Clock out |

### Leave
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/leave/requests` | List / submit leave requests |
| `PUT` | `/leave/requests/:id/status` | Approve or reject a request |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payroll/generate` | Trigger a payroll run |
| `PUT` | `/payroll/runs/:id/approve` | Approve payroll batch |

### Performance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/performance/cycles` | List / create performance cycles |
| `GET/POST` | `/performance/appraisals` | List / create appraisals |
| `PUT` | `/performance/appraisals/:id/status` | Update appraisal score/status |
| `POST` | `/performance/appraisals/:id/goals` | Add goals to an appraisal |
| `PUT` | `/performance/goals/:id` | Update a goal rating |

### Recruitment
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/recruitment/requisitions` | List / create job postings |

### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/claims` | List / create expense claims |
| `GET/PATCH` | `/claims/:id` | Get claim detail / submit / approve / reject |
| `POST` | `/claims/:id/items` | Add receipt item with image upload + OCR |
| `DELETE` | `/claims/:id/items/:itemId` | Remove receipt item |
| `POST` | `/claims/ocr` | Standalone OCR on a receipt image |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reports/custom` | Generate a custom data export |

---

## 🇮🇩 Indonesian Compliance

This system is purpose-built for Indonesian labor law compliance:

- **PPh 21 TER Method** (Tarif Efektif Rata-rata) — 2024 regulation
- **BPJS Kesehatan**: 1% employee / 4% employer, capped at Rp 12.000.000
- **BPJS Ketenagakerjaan**: JHT, JKK, JKM, JP with 2024 salary caps
- **PTKP Brackets**: TK/0–3 and K/0–3 status support
- **Leave Entitlements**: 12-day annual leave, Maternity (90 days), and more per UU No. 13/2003
- **Timezone Robustness**: Optimized for WIB (+07:00) with UTC-safe date handling, preventing "previous-day" shifts in attendance and scheduling.

---

## 📋 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers

npx prisma migrate dev   # Apply schema migrations
npx prisma db seed       # Seed initial data
npm run seed:features    # Seed feature expansion data (locations, work models, surat templates)
npm run seed:performance # Seed performance demo data
npm run seed:sample      # Seed full sample employee data
npx prisma studio        # Open Prisma database GUI
```

---

## 📄 License

This project is proprietary software developed for **Indowebhost Kreasi**. All rights reserved.
