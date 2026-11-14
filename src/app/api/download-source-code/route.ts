import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// GET /api/download-source-code - Generate and download project source code as zip
export async function GET(request: NextRequest) {
  try {
    const projectDir = process.cwd()
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const zipFileName = `groway-leruo-source-${timestamp}.tar.gz`
    const zipFilePath = path.join('/tmp', zipFileName)

    // Create tar.gz archive excluding node_modules, .next, dev.db, etc.
    try {
      execSync(
        `cd "${projectDir}" && tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='dev.db' --exclude='*.log' --exclude='tool-results' --exclude='.env.local' --exclude='.env.production' -czf "${zipFilePath}" .`,
        { timeout: 120000, stdio: 'pipe' }
      )
    } catch (err) {
      console.error('Archive creation error:', err)
      return NextResponse.json({
        error: 'Archive creation failed',
        message: getDeploymentInstructions()
      }, { status: 500 })
    }

    const fileBuffer = await readFile(zipFilePath)

    // Clean up temp file
    try { await unlink(zipFilePath) } catch {}

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Download source code error:', error)
    return NextResponse.json({
      error: 'Failed to generate download',
      message: getDeploymentInstructions()
    }, { status: 500 })
  }
}

function getDeploymentInstructions() {
  return `# Groway/Leruo Merchant OS - Deployment Guide

## Netlify Deployment
1. Clone or download this source code
2. Install dependencies: \`npm install\`
3. Set environment variables in Netlify dashboard
4. Deploy - Netlify auto-detects Next.js via netlify.toml

### Required Environment Variables:
- DATABASE_URL (e.g., postgresql://... for production, or file:./dev.db for SQLite demo)
- NEXTAUTH_SECRET (random string for session encryption)
- NEXT_PUBLIC_APP_URL (your Netlify URL)

## Vercel Deployment
1. Push to GitHub repository
2. Import in Vercel dashboard
3. Set environment variables
4. Deploy - Vercel auto-detects Next.js

## Self-Hosted / VPS
1. Download source code
2. Run: \`npm install && npx prisma db push\`
3. Run: \`npm run build && npm start\`
4. Access at http://localhost:3000

## Important Notes
- This project uses server-side API routes with Prisma ORM (SQLite)
- For production Netlify, consider migrating to a serverless-compatible database
- The proxy.ts file acts as middleware (Next.js 16 pattern)
- Run \`npm run db:push\` to initialize the database schema`
}
