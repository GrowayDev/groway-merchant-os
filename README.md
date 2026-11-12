# Groway Superapp

A comprehensive multi-vertical fintech platform for South Africa.

## 🚀 Deploy to Netlify

### Option 1: Drag & Drop Deployment

1. **Download the backup file** from `/download` page
2. **Extract the zip** to a folder on your computer
3. **Go to [Netlify](https://app.netlify.com)**
4. **Drag and drop** the extracted folder to the Netlify dashboard

### Option 2: Git-based Deployment

1. Push this project to GitHub/GitLab/Bitbucket
2. Connect your repository in Netlify
3. Build settings are already configured in `netlify.toml`

## Build Settings (Pre-configured)

- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 20

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main landing page
│   ├── consumer-wallet/   # Consumer wallet app
│   ├── merchant-os/       # Merchant OS (12 verticals)
│   ├── grosupply/         # B2B procurement
│   ├── gopay/             # Payment gateway
│   ├── admin-console/     # Admin dashboard
│   └── enterprise/        # Enterprise solutions
├── components/ui/         # shadcn/ui components
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities
```

## Features

### Consumer Wallet
- QR Payments, P2P Transfers, Remittance
- Bill Pay & Prepaid Services
- Savings Goals, Mini Programs

### Merchant OS (12 Verticals)
- Smart POS with vertical-specific layouts
- Inventory Management (3,930+ pre-loaded SKUs)
- ERP & Accounting, CRM & Loyalty
- HRM & Payroll, Marketing Tools

### Value-Added Services
- GroCredit (Merchant Capital)
- GroSupply (B2B Procurement)
- Vouchers & Gift Cards (13 categories)
- Ticketing (Transport & Events)

### Payments
- EMVCo QR Pay
- T+0 QR Settlement
- PayShap Integration

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Prisma ORM (SQLite/PostgreSQL)
- **Icons:** Lucide React

## License

© 2026 Groway (Pty) Ltd. All rights reserved.
