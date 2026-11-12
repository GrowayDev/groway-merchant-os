import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'Groway_Investor_Pitch_Deck.pptx');
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="Groway_Investor_Pitch_Deck.pptx"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving pitch deck:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
