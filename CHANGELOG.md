# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.8.0] — 2026-04-10

### Added
- **Platform User Management**: A new centralized "Platform Users" tab within the Settings module for administrating HRIS users.
  - Supports complete CRUD operations (Create, Read, Update, Delete) for system users.
  - Ability to optionally link a User account to an Employee profile natively via UI.
  - Integrated password reset handling and self-deletion safeguards.
- **Centralized Role-Based Access Control (RBAC)**: Implemented a robust permissions architecture mapping standard roles (e.g., `SYSTEM_ADMIN`, `HR_ADMIN`) to granular permission tokens (e.g., `employees.read`, `leave.approve`).
  - Applied `requirePermission()` checks across all `/api/v1` routes to prevent unauthorized access.
  - Implemented `hasPermission()` system logic on the client for conditional UI rendering.
- **Dynamic Roles Matrix**: The "Roles & Permissions" tab in Settings has been converted to an interactive, read-only UI showing exactly which permission tokens are mapped to each system role.

### Changed
- **Dynamic Sidebar Navigation**: The application `Sidebar` now restricts visible navigation elements based on the authenticated user's permission sets.

---

## [0.7.1] — 2026-04-10

### Fixed
- **Timesheet Generation**: Resolved "Unknown argument" error by aligning `TimesheetService` with the Prisma schema (renamed `actualStart/End` to `actualClockIn/Out` and removed non-existent fields).
- **Timezone Shifting Bug**: Transitioned Attendance, Scheduling, and Timesheet logic to use UTC consistently, preventing date-shifting errors in locales ahead of UTC (e.g., Indonesia/WIB).
- **UI Data Integrity**: Updated Schedule and Timesheet components to render dates using UTC, ensuring correct calendar display across all browser timezones.

---

## [0.7.0] — 2026-04-09

### Added
- **Work Model Scheduling**: Integrated full work model assignment and scheduling into the Department module.
- **Schedule Generation Engine**: Automated generation for Regular and Shift models:
  - **Regular**: Auto-assigns shifts with holiday/weekend detection.
  - **Shift**: Implements a round-robin rotation across multiple shifts (2-shift, 3-shift) with automatic rest day allocation.
- **Timesheet Engine**: Initial implementation of automated timesheet collation (Schedule vs Attendance) with status detection:
  - Automatically identifies `PRESENT`, `LATE`, `ABSENT`, `HOLIDAY`, and `OFF_DAY`.
  - Configurable 15-minute grace period for lateness.
- **Layout Restructuring**: Major UX overhaul of the Department Detail page:
  - Logical grouping: Info & Models (Row 1), Employees & Positions (Row 2), Workflows (Full width), and Operational Tracking (Full-width grid).

### Changed
- **Shift Logic**: National holidays no longer override shift worker rotations (they keep their shifts), while still being marked as holidays for payroll flagging.
- **API Routes**: Refactored all `/api/v1/departments/[id]/*` routes to use `Promise<{ id: string }>` for `params` to ensure Next.js 15+ compatibility.

### Fixed
- **Unique Constraint Error**: Resolved `Unique constraint failed (employeeId, date)` in schedule/timesheet regeneration by synchronizing UTC date handling across the server.
- **API Data Binding**: Fixed `DepartmentWorkModelsCard` to correctly parse direct array responses from the work-time-models API.
- **500 Internal Error**: Resolved "Department Not Found" by regenerating the Prisma Client after schema changes.

---

## [0.6.0] — 2026-04-08

### Added
- **PWA Approvals:** New `/ess/approvals` interface for managers to review and action (approve/reject) pending Leave and Expense Claims directly from the PWA.
- **Approvals API:** Centralized `POST /api/v1/ess/approvals/process` route to handle unified request state modifications and notify requesters automatically via in-app alerts and email.
- **PWA Notifications:** Added a dynamic Notification Bell badge to the ESS Dashboard header.
- **PWA Notifications Page:** Built a dedicated `/ess/notifications` view for reading and managing in-app push alerts directly from the mobile UI.

### Changed
- **API Authentication:** Updated the `GET /api/v1/notifications` endpoint to support session fallback using `getEssSession()`, ensuring mobile users receive alerts independently of desktop web sessions.

---

## [0.5.0] — 2026-04-08

### Added

#### Organization Settings
- **Locations module** — CRUD for company branch/office locations with department/employee counts
- **Work Time Models** — Configurable shift schedules (Regular, 2-Shift, 3-Shift) with per-shift start/end/break times
- **Approval Workflows** — Per-department, per-approval-type mapping of Level 1 and Level 2 approvers; 2-level enforced for `BUDGETING` type
- **Grade per Position mapping** — Associate multiple salary grades to organizational positions
- `GET|POST /api/v1/organization/locations` — Locations CRUD
- `GET|POST /api/v1/organization/work-time-models` — Work Time Models CRUD
- `GET|POST /api/v1/organization/approval-workflows` — Approval Workflow upsert
- `GET|POST /api/v1/organization/position-grades` — Position-Grade mapping
- Organization page refactored into 5-tab layout: Overview, Locations, Work Models, Workflows, Grade Mapping

#### Employee Salary Details
- **Tunjangan (Allowances)** — Per-employee fixed and attendance-based allowances with category/basis classification
- **Monthly Variable Inputs** — Monthly THR, Overtime, Bonus, Commission inputs per pay period  
- "Salary Detail" tab added to Employee Profile page
- "Surat History" tab added to Employee Profile page (placeholder → fully functional)
- `GET|POST /api/v1/employees/:id/allowances` — Allowances CRUD
- `PUT|DELETE /api/v1/employees/:id/allowances/:allowanceId` — Single allowance management
- `GET|POST /api/v1/employees/:id/variable-inputs` — Monthly variable input upsert

#### Payroll Engine Integration
- `generatePayroll` engine now reads **live allowances** from `EmployeeAllowance` table (fixed & attendance-based)
- `generatePayroll` engine now reads **monthly variable inputs** (THR, Overtime, Bonus, Commission) from `MonthlyVariableInput` instead of hardcoded dummy values
- Attendance-based allowances calculated using actual clock-in/out days present

#### Surat (Letter) Template System
- 14 default surat types seeded: SP1, SP2, SP3, Pengangkatan, Promosi, Demosi, Mutasi, Pemberhentian, Pengunduran Diri, Purchase Request, Tugas, Keterangan Penghasilan, Paklaring, Keterangan Kerja
- **Auto-numbering** with configurable format string (`{{seq}}/{{month}}/TYPE/HR/{{year}}`) — month rendered in Roman numerals
- **HTML template compilation** — placeholders `{{employee_name}}`, `{{position}}`, `{{department}}`, `{{reason}}`, `{{hire_date}}`, `{{issued_date}}`, `{{surat_number}}` auto-filled on generation
- **Surat History** tracking per employee with associated generated HTML stored in DB
- **Print/PDF** — opens compiled HTML in new tab for browser print-to-PDF
- `GET /api/v1/surat/templates` — List all templates
- `GET|PUT /api/v1/surat/templates/:id` — Get/update a specific template
- `GET|POST /api/v1/employees/:id/surat` — Get history / generate new surat for employee
- New dashboard page `/surat-templates` with sidebar navigation entry and split-pane HTML editor UI
- "Surat Templates" added to sidebar navigation

#### Notifications & Email (Nodemailer)
- **EmailService** — Nodemailer SMTP wrapper; config loaded dynamically from `EmailConfig` DB table; supports SSL (port 465) and STARTTLS (port 587)
- 3 pre-built HTML email templates: Approval Request (for approvers), Approval Status Update (for requesters), General System Notification
- **NotificationService** — In-app notifications with optional simultaneous email dispatch
  - `create()`, `getForUser()`, `getUnreadCount()`, `markRead()`, `markAllRead()`
  - `notifyApprover()` / `notifyRequester()` — high-level helpers for approval event hooks
- **NotificationBell** UI component replacing static bell in Topbar: live poll (60s), unread badge count, type color-coding, mark-read / mark-all-read, time-ago display
- **Email Settings page** at `/settings/email` — full SMTP form with live test-send button and success/error feedback
- `GET /api/v1/notifications` — Paginated notification list + unread count for authenticated user
- `POST /api/v1/notifications/mark-all-read` — Bulk mark-read for authenticated user
- `POST /api/v1/notifications/:id/read` — Mark single notification as read
- `GET|POST|PUT /api/v1/settings/email` — EmailConfig CRUD
- `POST /api/v1/settings/email/test` — Live SMTP test send
- "Email Config" added to sidebar bottom nav

### Changed
- `prisma/schema.prisma` — Added 12+ new models: `Location`, `WorkTimeModel`, `WorkTimeSchedule`, `ApprovalWorkflow`, `PositionGrade`, `EmployeeAllowance`, `MonthlyVariableInput`, `SuratTemplate`, `SuratHistory`, `Notification`, `EmailConfig`; added relations back to `Employee`, `Department`, `Position`, `Grade`, `User`
- Employee Profile page (`/employees/:id`) refactored to 3-tab layout: Profile Overview, Salary Detail, Surat History
- Organization page (`/organization`) refactored to 5-tab layout
- Payroll engine (`payroll.service.ts`) — removed hardcoded transport allowance; now reads real data from DB
- Topbar `Bell` button replaced with live `NotificationBell` component

### Fixed
- `PositionGrade` model missing inverse relation fields on `Position` and `Grade` Prisma models — added `positionGrades` arrays to both
- Multiple API route params typed as `{ params: { id: string } }` updated to `{ params: Promise<{ id: string }> }` for Next.js 16 compatibility
- `getServerSession` (next-auth) replaced with project's `getSession` from `@/lib/auth/session` in notification routes

### Dependencies
- `nodemailer@^8.0.5` — SMTP email client for server-side email dispatch
- `@types/nodemailer@^8.0.0` — TypeScript types for nodemailer

### Database Migrations
- `20260408111201_feature_expansion` — applies all new schema changes

---

## [0.4.0] — 2026-04-04

### Added
- PWA manifest type fix — `purpose` corrected to `'maskable'` for valid MetadataRoute.Manifest type
- Initial ESS PWA approval menu scaffold

### Changed
- `src/app/manifest.ts` — Fixed TypeScript type error on icon `purpose` field

---

## [0.3.0] — 2026-04-03

### Added
- Docker Compose production configuration with multi-stage build
- DB_MODE environment variable control (`migrate` / `reset` / `skip`)
- `pg` PostgreSQL adapter for Prisma 7 compatibility
- `@prisma/adapter-pg` for driver adapter support

### Changed
- `DATABASE_URL` moved to `prisma.config.ts`; removed from `schema.prisma` datasource block (Prisma 7 requirement)

### Fixed
- Docker network connectivity — `DATABASE_URL` host updated from `localhost` to Docker service name

---

## [0.2.0] — 2026-03-31

### Added
- ESS Claims module with receipt image upload
- Tesseract.js OCR for automatic amount/merchant extraction from receipt images
- Claims approval workflow (Draft → Submitted → Approved/Rejected → Paid)
- `POST /api/v1/claims/:id/items` — Receipt item creation with OCR

### Fixed
- P2003 foreign key constraint violations in Claims API — added `employeeId` existence validation before DB operations

---

## [0.1.0] — 2026-04-02

### Added
- Initial application scaffolding with Next.js 15 App Router
- Employee Management (CRUD)
- Organization Chart (department hierarchy)
- Attendance (ESS clock-in/clock-out)
- Leave Management with balance enforcement
- Payroll Engine with BPJS and PPh 21 TER calculations
- Recruitment (ATS) pipeline
- Performance Management (cycles, appraisals, goals)
- Custom Report Builder with CSV export
- Liquid Glass design system
- JWT authentication with HTTP-only cookies
- Docker support
