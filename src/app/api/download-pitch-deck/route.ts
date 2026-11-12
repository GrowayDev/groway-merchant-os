import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'MerchantOS_Investor_Pitch_Deck.pptx');
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="MerchantOS_Investor_Pitch_Deck.pptx"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
