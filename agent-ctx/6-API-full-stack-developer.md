# Task 6-API - API Routes for LMS, Reporting, Mentorship

## Work Record

### LMS API Routes (6 files)
1. `/src/app/merchant-os/api/lms/courses/route.ts` - GET (list with ?category=, ?difficulty=), POST (create)
2. `/src/app/merchant-os/api/lms/courses/[id]/route.ts` - GET, PATCH, DELETE
3. `/src/app/merchant-os/api/lms/enrollments/route.ts` - GET (list with ?userId=, ?status=), POST (enroll)
4. `/src/app/merchant-os/api/lms/enrollments/[id]/route.ts` - GET (with progress), PATCH
5. `/src/app/merchant-os/api/lms/certifications/route.ts` - GET (?userId=), POST (issue)
6. `/src/app/merchant-os/api/lms/progress/route.ts` - POST (upsert lesson progress)

### Reporting API Routes (6 files)
1. `/src/app/merchant-os/api/reporting/stakeholders/route.ts` - GET (?role=, ?status=), POST
2. `/src/app/merchant-os/api/reporting/stakeholders/[id]/route.ts` - GET (with reports), PATCH, DELETE
3. `/src/app/merchant-os/api/reporting/reports/route.ts` - GET (?type=, ?status=), POST
4. `/src/app/merchant-os/api/reporting/reports/[id]/route.ts` - GET, PATCH, DELETE
5. `/src/app/merchant-os/api/reporting/shares/route.ts` - GET (?stakeholderId=), POST (bulk share)
6. `/src/app/merchant-os/api/reporting/access-log/route.ts` - GET (?reportId=, ?stakeholderId=)

### Mentorship API Routes (9 files)
1. `/src/app/merchant-os/api/mentorship/programs/route.ts` - GET, POST
2. `/src/app/merchant-os/api/mentorship/matches/route.ts` - GET (?status=, ?mentorId=, ?menteeId=), POST
3. `/src/app/merchant-os/api/mentorship/matches/[id]/route.ts` - GET (with sessions, goals, journals, milestones), PATCH
4. `/src/app/merchant-os/api/mentorship/sessions/route.ts` - GET (?matchId=, ?status=), POST
5. `/src/app/merchant-os/api/mentorship/sessions/[id]/route.ts` - GET, PATCH (complete/cancel/notes)
6. `/src/app/merchant-os/api/mentorship/goals/route.ts` - GET (?matchId=, ?category=, ?status=), POST
7. `/src/app/merchant-os/api/mentorship/goals/[id]/route.ts` - GET, PATCH, DELETE
8. `/src/app/merchant-os/api/mentorship/journal/route.ts` - GET (?matchId=, ?authorId=), POST
9. `/src/app/merchant-os/api/mentorship/milestones/route.ts` - GET (?matchId=), POST

## Summary
- **21 API route files** created
- All routes follow existing project patterns (NextRequest/NextResponse, db from @/lib/db, getMerchantIdWithDevFallback)
- No lint errors from new files
- All Prisma models used match the schema (Course, CourseEnrollment, LessonProgress, Certification, Stakeholder, StakeholderReport, ReportShare, ReportAccessLog, MentorshipProgram, MentorshipMatch, MentorshipSession, MentorshipGoal, MentorshipJournal, MentorshipMilestone)
