// app/api/parse-common-app/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseWithHaiku } from '@/lib/parseWithHaiku';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be under 10MB' },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdf(buffer);
    const rawText = pdfData.text;

    // Check if PDF has text (not a scanned image)
    if (!rawText || rawText.length < 100) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract text from PDF. Is it a scanned image?',
      }, { status: 400 });
    }

    // Parse with Claude Haiku
    console.log('Parsing with Claude Haiku...');
    const parsedData = await parseWithHaiku(rawText);

    // Calculate confidence (how many required fields are filled)
    const confidence = calculateConfidence(parsedData);

    if (confidence < 0.3) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract enough information from PDF.',
        partialData: parsedData,
        confidence,
      });
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      confidence,
      method: 'haiku',
    });

  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}

function calculateConfidence(data: any): number {
  let score = 0;
  const requiredFields = [
    data.personal?.firstName,
    data.personal?.lastName,
    data.academic?.highSchool,
    data.academic?.graduationYear,
  ];

  requiredFields.forEach(field => {
    if (field) score += 0.25;
  });

  return score;
}
```

---

## 📊 **COST BREAKDOWN (REAL NUMBERS)**
```
Input tokens:
- Your prompt: ~400 tokens
- PDF text: ~3,000 tokens (typical Common App)
- Total input: ~3,400 tokens

Output tokens:
- Structured JSON: ~800 tokens

Cost calculation:
Input:  3,400 × $1.00/1M  = $0.0034
Output:   800 × $5.00/1M  = $0.0040
Total:                     = $0.0074

≈ $0.007 per parse (less than 1 cent)