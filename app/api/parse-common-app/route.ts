// app/api/parse-common-app/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseWithHaiku } from '@/lib/parseWithHaiku';
import { calculateConfidence, normalizeHaikuPayload } from '@/lib/haiku/commonApp';
import { onboardingDataSchema } from '@/lib/onboarding/schemas';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be under 10MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdf(buffer);
    const rawText = pdfData.text ?? '';

    if (!rawText || rawText.length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract text from PDF. Is it a scanned image?'
        },
        { status: 400 }
      );
    }

    console.info('Parsing with Claude Haiku...');
    const { payload, usage } = await parseWithHaiku(rawText);
    const { data, errors } = normalizeHaikuPayload(payload);
    const confidence = calculateConfidence(data);

    const validation = onboardingDataSchema.safeParse({
      personal: {
        firstName: data.personal.firstName ?? '',
        lastName: data.personal.lastName ?? '',
        email: data.personal.email ?? '',
        phone: data.personal.phone ?? '',
        streetAddress: data.personal.streetAddress ?? '',
        city: data.personal.city ?? '',
        state: data.personal.state ?? '',
        zip: data.personal.zip ?? ''
      },
      academic: {
        highSchool: data.academic.highSchool ?? '',
        graduationYear: data.academic.graduationYear ?? 0,
        gpa: data.academic.gpa === null ? '' : String(data.academic.gpa),
        weightedGpa: data.academic.weightedGpa === null ? '' : String(data.academic.weightedGpa),
        satScore: data.academic.satScore === null ? '' : String(data.academic.satScore),
        actScore: data.academic.actScore === null ? '' : String(data.academic.actScore),
        classRank: data.academic.classRank ?? ''
      },
      activities: data.activities.map((activity) => ({
        title: activity.title,
        position: activity.position ?? '',
        descriptionShort: activity.descriptionShort ?? '',
        descriptionMedium: activity.descriptionMedium ?? '',
        descriptionLong: activity.descriptionLong ?? '',
        hoursPerWeek: activity.hoursPerWeek ?? undefined,
        weeksPerYear: activity.weeksPerYear ?? undefined,
        grades: activity.grades ?? []
      })),
      essays: data.essays.map((essay) => ({
        topic: essay.topic,
        text: essay.text,
        title: essay.title ?? '',
        tags: essay.tags?.length ? essay.tags : undefined,
        wordCount: essay.wordCount
      }))
    });

    const validationIssues = validation.success
      ? []
      : validation.error.issues.map((issue) => issue.path.join('.'));

    if (confidence < 0.3) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract enough information from PDF.',
        partialData: data,
        confidence,
        errors,
        validationIssues,
        usage
      });
    }

    return NextResponse.json({
      success: true,
      data,
      confidence,
      errors,
      validationIssues,
      usage,
      method: 'haiku'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse PDF';
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}