# 📊 REPORT_STATUS.md — HRIS Report Implementation Tracker

> Last updated: 2026-04-18

---

## Status Legend

| Icon | Status |
|:---:|---|
| ⬜ | Not Started |
| 🔧 | In Progress |
| ✅ | Completed |
| 🔜 | Coming Soon (planned, not in current sprint) |
| 🔒 | Blocked (dependency/schema issue) |

---

## Phase 1: P1 Reports (Current Sprint)

### 👥 Employee Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 1 | Active Employee List | `/reports/employees/active` | ✓ | ⬜ |
| 2 | Headcount & Demographics | `/reports/employees/headcount` | ✓ | ⬜ |
| 3 | Turnover Report | `/reports/employees/turnover` | ✓ | ⬜ |
| 4 | Contracts Expiring Soon | `/reports/employees/contracts-expiring` | ✓ | ⬜ |
| 5 | Employment History | `/reports/employees/history` | ✓ | ⬜ |
| 6 | Employee Family/Dependents | `/reports/employees/family` | ✓ | ⬜ |

> **Note**: Report #4 requires `contractEndDate` schema addition (Phase 0).

### ⏰ Attendance Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 7 | Monthly Attendance Recap | `/reports/attendance/monthly` | ✓ | ⬜ |
| 8 | Lateness Report | `/reports/attendance/lateness` | ✓ | ⬜ |
| 9 | Overtime Report | `/reports/attendance/overtime` | ✓ | ⬜ |
| 10 | Timesheet Detail | `/reports/attendance/timesheet` | ✓ | ⬜ |

### 🏖️ Leave Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 11 | Leave Balance Report | `/reports/leave/balance` | ✓ | ⬜ |
| 12 | Leave Request History | `/reports/leave/history` | ✓ | ⬜ |

### 💰 Payroll Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 13 | Monthly Payslips | `/reports/payroll/payslips` | ✓ | ⬜ |
| 14 | Salary Recap per Department | `/reports/payroll/department-recap` | ✓ | ⬜ |
| 15 | Payroll Journal Entry | `/reports/payroll/journal` | ✓ | ⬜ |
| 16 | Bank Transfer File | `/reports/payroll/bank-file` | ✓ | ⬜ |
| 17 | Incentive & Bonus Report | `/reports/payroll/incentives` | ✓ | ⬜ |

### 📋 Tax & BPJS Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 18 | Monthly PPh 21 Return | `/reports/tax/pph21` | ✓ | ⬜ |
| 19 | Form 1721-A1 (Annual) | `/reports/tax/form-1721a1` | ✓ | ⬜ |
| 20 | BPJS Kesehatan Report | `/reports/bpjs/kesehatan` | ✓ | ⬜ |
| 21 | BPJS Ketenagakerjaan (SIPP) | `/reports/bpjs/ketenagakerjaan` | ✓ | ⬜ |

### 🎯 Recruitment Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 22 | Recruitment Pipeline | `/reports/recruitment/pipeline` | ✓ | ⬜ |

### 💳 Claims & Surat Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 23 | Claims / Expense Report | `/reports/claims/summary` | ✓ | ⬜ |
| 24 | Surat Issuance Log | `/reports/surat/log` | ✓ | ⬜ |

---

## Phase 2: Coming Soon

### 📊 Performance Reports

| # | Report | API Route | Frontend | Status |
|:---:|---|---|---|:---:|
| 25 | Performance Appraisal Summary | `/reports/performance/summary` | - | 🔜 |

> **Reason**: Marked as "Coming Soon" until the Performance module is more mature.

---

## Phase 3: Future Enhancements (P2+)

| # | Report | Notes | Status |
|:---:|---|---|:---:|
| 26 | Candidate Source Analysis | Breakdown by `Candidate.source` | 🔜 |
| 27 | Payroll Cost Trend | Monthly trend chart over N months | 🔜 |
| 28 | Leave Summary by Department | Aggregated leave days by dept/type | 🔜 |
| 29 | Interview Schedule Report | Interview listing with feedback | 🔜 |

---

## Infrastructure Status

| Component | Status |
|---|:---:|
| Schema: `contractEndDate` on Employee | ⬜ |
| Library: `exceljs` installed | ⬜ |
| `ReportExportService` (Excel/CSV generator) | ⬜ |
| `ReportService` (data queries) | ⬜ |
| `ReportDownloadDialog` (frontend component) | ⬜ |
| Reports page overhaul (7 categories) | ⬜ |
| Employee form: Contract End Date field | ⬜ |

---

## Notes

- All P1 reports support **Excel (.xlsx)** and **CSV** export formats
- Bank Transfer File uses generic format; bank-specific formats (BCA/Mandiri/BNI/BRI) can be added later
- Performance Appraisal Summary will show "Coming Soon" badge in the UI
- Custom Report Builder (existing) remains functional alongside predefined reports
