import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(process.cwd(), 'public', 'Groway_Platform_Product_Document.pdf');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found', path: filePath }, { status: 404 });
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Groway_Platform_Product_Document.pdf"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
