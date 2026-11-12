# Task 8-c: Refactor DentalPracticeView.tsx to use real API routes

## Task Summary
Refactored DentalPracticeView.tsx to remove all mock data and use real API routes for data fetching.

## Work Completed

### 1. Created API Routes for Health Professionals
Created 5 new API routes in `/api/merchant-os/health/`:

- **hpcsa/route.ts** - GET/POST for HPCSA registrations
  - Uses ProfessionalRegistration model with council='HPCSA' filter
  - Auto-calculates status based on expiry date (active/expired/pending_renewal)

- **cpd/route.ts** - GET/POST for CPD tracking
  - Uses CPDActivity model linked to ProfessionalRegistration
  - Auto-calculates compliance status (compliant/at_risk/non_compliant)
  - Aggregates activities and calculates total points

- **radiation-safety/route.ts** - GET/POST for X-ray equipment compliance
  - Uses RadiationSafetyEquipment model
  - Auto-calculates status based on inspection and licence expiry dates

- **lab-work/route.ts** - GET/POST/PUT for dental lab work orders
  - Uses DentalLabWork model
  - Supports full lifecycle: ordered → in_progress → ready → delivered → fitted
  - JSON parsing for toothNumbers array

- **indemnity/route.ts** - GET/POST for professional indemnity insurance
  - Uses ProfessionalIndemnityInsurance model
  - Auto-calculates status based on end date

### 2. Refactored DentalPracticeView.tsx

#### Mock Data Removed:
- 3 fake patients (Thandi Mokoena, Johan van der Merwe, Priya Naidoo)
- 4 fake appointments
- 2 fake treatment plans
- 3 fake lab work orders
- 3 fake HPCSA records
- 2 fake CPD records with activities
- 2 fake radiation safety equipment records
- 2 fake indemnity insurance policies

#### New Features:
- `fetchData` function using `useCallback` for parallel API calls
- EmptyState component for all data sections
- Proper error handling with try-catch
- All stats initialized to 0 for new tenants
- Refresh button functionality

#### UI Sections with Empty States:
- Appointments tab (no API yet)
- Treatment Plans tab (no API yet)
- Lab Work tab
- HPCSA Registration section
- CPD Points section
- Radiation Safety section
- Professional Indemnity section

## Technical Details

### API Route Pattern:
```typescript
// GET handler
export async function GET(request: NextRequest) {
  const merchantId = request.headers.get('x-merchant-id') ||
    request.nextUrl.searchParams.get('merchantId')
  
  if (!merchantId) {
    return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
  }
  
  const records = await db.model.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json({ records })
}
```

### Data Fetching Pattern:
```typescript
const fetchData = useCallback(async () => {
  setLoading(true)
  try {
    const [hpcsaRes, cpdRes, radiationRes, labWorkRes, indemnityRes] = await Promise.all([
      fetch('/api/merchant-os/health/hpcsa'),
      fetch('/api/merchant-os/health/cpd'),
      fetch('/api/merchant-os/health/radiation-safety'),
      fetch('/api/merchant-os/health/lab-work'),
      fetch('/api/merchant-os/health/indemnity'),
    ])
    // Parse and set data...
  } catch (error) {
    console.error('Error fetching data:', error)
    // Reset to empty arrays
  } finally {
    setLoading(false)
  }
}, [])
```

## Files Modified
- `/api/merchant-os/health/hpcsa/route.ts` (created)
- `/api/merchant-os/health/cpd/route.ts` (created)
- `/api/merchant-os/health/radiation-safety/route.ts` (created)
- `/api/merchant-os/health/lab-work/route.ts` (created)
- `/api/merchant-os/health/indemnity/route.ts` (created)
- `/app/merchant-os/app/components/DentalPracticeView.tsx` (refactored)
- `/worklog.md` (updated)

## Notes
- Patients and appointments APIs are not yet available - these are set to empty arrays
- All currency values use ZAR (R) format
- HPCSA compliance tracking supports South African dental practice requirements
- Component maintains exact same UI layout and styling
