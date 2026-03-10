You are a senior HR-tech solution architect and full‑stack engineer specializing in HRIS for Indonesian companies (including payroll, BPJS, and PPh 21 compliance).

I want you to design a PRODUCTION‑GRADE, web‑based Human Resource Information System (HRIS) for INTERNAL use in a single company with about 500 employees in Indonesia (general industry, not tech-specific).

## 1. Context and constraints

- Target organization:
  - ~500 employees
  - Mix of office staff and non-tech roles
  - Operating in Indonesia, must follow local labor, payroll, and tax regulations.

- Purpose:
  - Internal HRIS used only by this company, NOT a multi‑tenant SaaS.
  - System must be modular and scalable so we can add or swap modules over time.

- Tech stack:
  - Web-based application.
  - Frontend: Next.js (React, TypeScript).
  - Backend: You may assume Next.js API routes or a Node.js/TypeScript service layer behind the Next.js app (you decide and justify).
  - Database: PostgreSQL.
  - Architecture should be modular / domain‑driven (clear bounded contexts per HR domain).

- Key Indonesian compliance requirements:
  - Payroll must support:
    - PPh 21 income tax (monthly withholding + annual reconciliation).
    - BPJS Kesehatan and BPJS Ketenagakerjaan (including the relevant sub-programs like JHT, JKK, JKM, JP, as appropriate).
    - THR, overtime, allowances, bonuses, and other common components in Indonesian payroll.
  - System should be designed so rates, formulas, and rules can be updated without code changes where possible (e.g., via configuration tables).

- Integrations (design at a conceptual level):
  - Payroll / tax:
    - Generation of data/files/reports needed for:
      - Monthly and annual PPh 21 reporting.
      - BPJS submissions and reporting.
  - Banking:
    - Bank disbursement for salary payments (export files or API integration).
  - Optional future integrations (mention where they would plug in):
    - Accounting/ERP.
    - Time clocks or biometric attendance devices.
    - External learning platforms.

## 2. Overall objectives for your answer

Design a comprehensive HRIS that covers the FULL employee lifecycle and can realistically be implemented as a production system in this tech stack.

Your deliverable should be structured and detailed enough that:
- A product manager can understand the scope and prioritize phases.
- An engineering team can start designing services, APIs, and database schemas.
- An HR leader can see that the solution meets Indonesian HR and payroll needs.

## 3. High-level structure for your response

Follow this exact structure in your answer:

1) Assumptions & clarifying questions
   - Briefly list any key assumptions you are making.
   - Ask any 5–10 targeted clarifying questions that you would need answered before implementation (but still continue with the rest of the design using reasonable assumptions).

2) Module map and user roles
   - Propose a clear module map for the HRIS tailored to a 500‑employee Indonesian company.
   - At minimum, consider:
     - Core HR / Employee Master Data
     - Organization & Job Structure
     - Time & Attendance
     - Leave & Absence Management
     - Payroll (with PPh 21, BPJS, THR, overtime, etc.)
     - Benefits & BPJS Management
     - Recruitment / ATS
     - Onboarding & Offboarding
     - Performance Management
     - Learning & Development
     - Employee Self‑Service (ESS)
     - Reporting & Analytics
     - Administration, Security & Audit
   - Define key user roles (e.g., HR Admin, Payroll Specialist, Line Manager, Employee, Finance, System Admin) and summarize what each can do.

3) System architecture (logical and technical)
   - Describe the logical architecture:
     - How modules are separated as domains/bounded contexts.
     - How data flows between modules (e.g., attendance → payroll, recruitment → employee master, etc.).
   - Describe the technical architecture with Next.js + Node + PostgreSQL:
     - Frontend layer (Next.js pages/app router, authentication, layout).
     - API / backend layer (REST or GraphQL, service boundaries, integration layer).
     - Database layer (schema organization, schemas per module vs shared).
   - Explain how you would enforce modularity (e.g., using domain-driven design, folder structure, service boundaries).

4) Detailed modules and key features
   For EACH main module, provide:
   - Purpose of the module.
   - 8–15 key features or sub‑functions.
   - Important workflows (e.g., for payroll: monthly cycle from data cut‑off to approval to disbursement; for recruitment: requisition → posting → screening → offer → hire).
   - Specific Indonesian requirements where relevant:
     - Payroll: PPh 21, BPJS contributions, THR, overtime, allowances, deductions, payslips, compliance reports.
     - Time & Attendance: local overtime rules patterns, shift scheduling support, link to payroll.
     - BPJS & Tax: how the system stores configuration for rates/brackets and generates the necessary output.
   - Mention which features are MVP vs can be Phase 2+ for a 500-employee company.

5) Data model / database design
   - Propose a high-level relational data model in PostgreSQL.
   - List the most important tables/entities for each module with:
     - Table name.
     - Key columns/attributes (just the most important 8–15 per table).
     - Primary relationships (1‑to‑many, many‑to‑many) and how they’re represented.
   - Pay special attention to:
     - Employee master data and employment history.
     - Job & org structure (departments, positions, grades).
     - Time & attendance records.
     - Payroll runs, payroll items, tax and BPJS components.
     - Configuration tables for PPh 21, BPJS rates, THR rules, and other statutory components.
   - Explain how you would design for auditability (e.g., storing snapshots of tax rules used for a given payroll run).

6) Security, access control, and audit
   - Propose a role‑based access control (RBAC) model that fits the user roles.
   - Describe how sensitive payroll/tax/BPJS data is protected:
     - At-rest encryption where appropriate, field‑level or column‑level encryption where needed.
     - Separation of concerns in UI and API (who can see what).
   - Describe audit logging:
     - What actions are logged (e.g., changes to employee data, payroll edits).
     - How logs are stored and queried.

7) Compliance and localization (Indonesia-focused)
   - Summarize how the system design supports:
     - Compliance with Indonesian payroll tax (PPh 21) workflows.
     - BPJS Kesehatan and BPJS Ketenagakerjaan contributions and reporting.
     - THR calculations and edge cases.
   - Describe how you would make the system adaptable to changes in:
     - Tax brackets, BPJS rates, and regulation changes (e.g., via configuration tables + versioning + effective dates).
   - Mention basic localization aspects:
     - Support for Indonesian language and date/number formats.
     - Storing IDs like NPWP, NIK, BPJS numbers securely.

8) Integrations and extensibility
   - Describe the integration strategy:
     - How integration with banks, BPJS portals, and tax reporting systems would work conceptually (e.g., file exports, APIs).
   - Suggest generic APIs or export formats:
     - For payroll results, BPJS reports, and PPh 21 reporting.
   - Explain how you would keep the core HRIS modular so that:
     - Payroll or T&A modules could be replaced or integrated with third‑party systems in the future.

9) Implementation roadmap and phasing
   - Propose a practical implementation roadmap for this 500‑employee internal HRIS:
     - Phase 1 (MVP): which modules and features should be delivered first to deliver maximum value and compliance.
     - Phase 2: which advanced modules or optimizations to add.
     - Phase 3: analytics, deeper automation, and nice‑to‑have capabilities.
   - For each phase, specify:
     - Primary objectives.
     - Dependencies between modules (e.g., Core HR before Payroll).

10) Non-functional requirements and quality attributes
    - List key non-functional requirements:
      - Performance targets (e.g., response times, batch payroll runtime for 500 employees).
      - Availability and backup/restore strategies.
      - Logging, monitoring, and error handling.
    - Explain any architectural decisions that particularly support:
      - Scalability to 1,000+ employees.
      - Maintainability and ease of updating regulatory logic.
      - Testability (e.g., how you would structure modules for unit and integration testing).

## 4. Style and depth

- Think step by step and clearly explain reasoning and trade‑offs, but keep the answer well structured and not verbose for the sake of it.
- Use clear headings and subheadings following the numbered sections above.
- Use concise bullet points for lists rather than long paragraphs where possible.
- Whenever you introduce an important table, workflow, or rule, briefly explain WHY it is needed in the context of Indonesian HR/payroll practice.
- If you see any risks or alternative design options (e.g., different ways to handle payroll rules configuration), call them out explicitly with pros and cons.

Start by restating the scenario in your own words, listing your key assumptions, and then proceed with section (1) through (10).
