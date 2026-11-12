# Task ID: 2-b - EngineeringView.tsx Component

**Agent:** Subagent
**Task:** Create EngineeringView.tsx component for Merchant OS Professional Services vertical

## Work Summary

Created a comprehensive Engineering Services Management view tailored for South African engineering firms with ECSA compliance requirements.

## File Created

`/home/z/my-project/src/app/merchant-os/app/components/EngineeringView.tsx`

## Features Implemented

### 1. Engineering-Specific Features
- **Project Management** with engineering disciplines (Civil, Structural, Electrical, Mechanical, Geotechnical, Environmental, Project Management)
- **Time Tracking** with billable hours per project, hourly rates, and approval workflow
- **Expense & Disbursement Tracking** with categories (travel, testing, materials, printing, consultant)
- **Milestone Billing** with progress tracking and billing status
- **Deliverable Tracking** (drawings, specifications, reports, calculations, models, BOQ)
- **Team Member Management** with roles and rates

### 2. ECSA Compliance
- **Registration Tracking** for all levels (Candidate, Pr.Eng., Pr.Tech.Eng., Pr.Cert.Eng., Pr.Tech.)
- **CPD Points Tracking** with 3-year cycle requirements (25/20/15 points per level)
- **Annual Renewal Reminders** with expiry date alerts
- **Registration Certificate Display** capability
- **Discipline Tracking** for each registration

### 3. South Africa Specific
- **CIDB Contractor Grading Integration** (1CE to 9CE grades)
- **NHBRC Enrollment** tracking for structural projects
- **SABS/SANS Standards References** (SANS 10400, 10160, 10162, 10100, 10142, etc.)
- **Local Authority Submission Tracking** (Municipal, Provincial, NHBRC, CIDB)

### 4. UI Structure (Similar to RealEstateView.tsx)
- **Summary Cards**: Active Projects, Total Fees, Billable Hours, Unbilled Hours, Milestones Due, ECSA Active, Renewal Due, CPD Compliant, Pending Submissions, Pending Expenses
- **Projects Table**: With discipline icons, status, client, value, progress, milestones, team
- **CPD Tracking Section**: Progress bars per staff member with cycle requirements
- **Timesheet Integration**: Time entries table with hours, rates, amounts, approval status
- **Recent Activity**: Latest time entries, milestone alerts, ECSA alerts

## UI Tabs
1. **Overview**: Dashboard with active projects, ECSA alerts, milestones, timesheet, submissions, CPD
2. **Projects**: Full project list with search/filter by discipline
3. **Timesheet**: Time tracking with logging capability
4. **Expenses**: Disbursement tracking and management
5. **ECSA**: Registration management and certificates
6. **CPD**: Continuing Professional Development tracking
7. **Submissions**: Local authority and statutory submissions

## Dialogs
- New Project Dialog with all engineering-specific fields
- New Time Entry Dialog
- Project Details Dialog with milestones, deliverables, team

## Mock Data Included
- 3 engineering projects (Civil, Structural, Electrical)
- 4 time entries with different staff
- 3 expense entries
- 4 ECSA registrations
- 4 CPD records
- 4 authority submissions
- 6 SABS/SANS standards

## South African Context
- Currency formatting with R (Rand) symbol
- Province dropdown (all 9 SA provinces)
- Municipal/Government/Private/Parastatal client types
- CIDB grading system integration
- NHBRC enrollment for structural projects
- ECSA registration number format

## Dependencies Used
- shadcn/ui components (Card, Badge, Button, Input, Dialog, Select, Tabs, Progress, ScrollArea)
- Lucide icons for engineering disciplines and actions
- Tailwind CSS for styling
