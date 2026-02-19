// lib/parseWithHaiku.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ParsedCommonApp {
  personal: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  academic: {
    highSchool?: string;
    graduationYear?: number;
    gpa?: string;
    weightedGpa?: string;
    satScore?: string;
    actScore?: string;
    classRank?: string;
  };
  activities: Array<{
    title: string;
    position?: string;
    description: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    grades?: number[];
  }>;
  essays: Array<{
    topic: string;
    text: string;
    wordCount: number;
  }>;
}

export async function parseWithHaiku(pdfText: string): Promise<ParsedCommonApp> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-3-5-20241022',
    max_tokens: 2000,
    temperature: 0, // Deterministic output
    messages: [{
      role: 'user',
      content: `You are parsing a Common Application PDF. Extract the following information and return ONLY valid JSON, no markdown, no explanation.

**CRITICAL RULES:**
1. Return ONLY the JSON object, nothing else
2. If a field is missing/unclear, use null
3. For activities: extract FULL titles, don't truncate
4. For essays: preserve the text as-is, don't summarize
5. graduationYear must be a number (e.g., 2026)
6. grades must be an array of numbers (e.g., [11, 12])

**Expected JSON structure:**
{
  "personal": {
    "firstName": string | null,
    "lastName": string | null,
    "email": string | null,
    "phone": string | null,
    "streetAddress": string | null,
    "city": string | null,
    "state": string | null (2-letter code),
    "zip": string | null
  },
  "academic": {
    "highSchool": string | null,
    "graduationYear": number | null,
    "gpa": string | null,
    "weightedGpa": string | null,
    "satScore": string | null,
    "actScore": string | null,
    "classRank": string | null (format: "15/350")
  },
  "activities": [
    {
      "title": string,
      "position": string | null,
      "description": string,
      "hoursPerWeek": number | null,
      "weeksPerYear": number | null,
      "grades": number[] | null
    }
  ],
  "essays": [
    {
      "topic": string (e.g., "personal_statement"),
      "text": string,
      "wordCount": number
    }
  ]
}

**Common App PDF Text:**
${pdfText}

Return ONLY the JSON object.`
    }]
  });

  // Extract text from response
  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let jsonText = content.text.trim();

  // Strip markdown code fences if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```(?:json)?\n?/g, '').trim();
  }

  // Parse JSON
  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (error) {
    console.error('Failed to parse Claude response:', jsonText);
    throw new Error('Claude returned invalid JSON');
  }
}