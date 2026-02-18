import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseCommonApp } from '@/lib/parser/parseCommonApp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    const result = parseCommonApp(pdfData.text ?? '');

    return NextResponse.json(result);
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ success: false, error: 'Failed to parse PDF' }, { status: 500 });
  }
}
