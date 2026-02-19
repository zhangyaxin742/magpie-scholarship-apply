import Anthropic from '@anthropic-ai/sdk';
import type { HaikuCommonAppPayload } from '@/lib/haiku/commonApp';

const MODEL = 'claude-haiku-3-5-20241022';
const INPUT_COST_PER_MILLION = 1;
const OUTPUT_COST_PER_MILLION = 5;

export interface HaikuUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: {
    input: number;
    output: number;
    total: number;
  };
}

export interface HaikuParseResult {
  payload: HaikuCommonAppPayload;
  usage: HaikuUsage;
}

const buildPrompt = (pdfText: string) => `You are parsing a Common App PDF into JSON. Return ONLY valid JSON. No markdown, no extra text.

Rules:
- Use snake_case keys exactly as shown.
- Use null when missing or unclear. Do not guess.
- Numbers must be numeric types, not strings.
- Arrays must be empty when nothing is present.
- Max 10 activities, max 5 essays.

Value constraints:
- state: 2-letter uppercase code.
- graduation_year: integer between 2020 and 2035.
- gpa, weighted_gpa: decimal between 0.0 and 5.0.
- sat_score: integer 400-1600.
- act_score: integer 1-36.
- hours_per_week: integer 0-168.
- weeks_per_year: integer 0-52.
- grades: array of unique integers in [9, 10, 11, 12].
- word_count: integer 1-10000.

Enums:
- gender: male, female, non_binary, prefer_not_to_say, other, or null.
- agi_range: under_30k, 30k_60k, 60k_100k, over_100k, or null.
- essay topic: personal_statement, leadership, challenge, community_service, diversity, career_goals, academic_interest, extracurricular, work_experience, other.

Activities: provide description_short (<=50 chars), description_medium (<=150 chars), description_long (<=500 chars). Do not summarize; truncate only.
Essays: preserve text exactly; include title if present; tags array if present.

Return this exact JSON structure:
{
  "personal": {
    "first_name": string | null,
    "last_name": string | null,
    "email": string | null,
    "phone": string | null,
    "street_address": string | null,
    "city": string | null,
    "state": string | null,
    "zip": string | null
  },
  "academic": {
    "high_school": string | null,
    "graduation_year": number | null,
    "gpa": number | null,
    "weighted_gpa": number | null,
    "sat_score": number | null,
    "act_score": number | null,
    "class_rank": string | null
  },
  "demographics": {
    "gender": string | null,
    "ethnicity": string[] | null,
    "first_generation": boolean | null,
    "agi_range": string | null
  },
  "activities": [
    {
      "title": string | null,
      "position": string | null,
      "description_short": string | null,
      "description_medium": string | null,
      "description_long": string | null,
      "hours_per_week": number | null,
      "weeks_per_year": number | null,
      "grades": number[] | null
    }
  ],
  "essays": [
    {
      "topic": string | null,
      "title": string | null,
      "text": string | null,
      "tags": string[] | null,
      "word_count": number | null
    }
  ]
}

Common App PDF Text:
${pdfText}

Return ONLY the JSON object.`;

const message = await anthropic.messages.create({
  model: MODEL,
  max_tokens: 2000,
  temperature: 0,
  system: "You are a data extraction engine. Output ONLY valid JSON that matches the schema. No prose, no markdown.",
  messages: [{ role: "user", content: buildPrompt(cleanedText) }]
});

const extractJson = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Claude returned empty response');
  const withoutFences = trimmed.startsWith('```')
    ? trimmed.replace(/```(?:json)?/g, '').trim()
    : trimmed;
  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Claude returned invalid JSON');
  }
  return withoutFences.slice(firstBrace, lastBrace + 1);
};

const buildUsage = (usage?: { input_tokens?: number; output_tokens?: number }): HaikuUsage => {
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostUsd: {
      input: Number(inputCost.toFixed(6)),
      output: Number(outputCost.toFixed(6)),
      total: Number((inputCost + outputCost).toFixed(6))
    }
  };
};

export async function parseWithHaiku(pdfText: string): Promise<HaikuParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  const cleanedText = pdfText.trim();
  if (!cleanedText) {
    throw new Error('No text content available for parsing');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: buildPrompt(cleanedText)
      }
    ]
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned a non-text response');
  }

  const jsonText = extractJson(textBlock.text);

  try {
    const payload = JSON.parse(jsonText) as HaikuCommonAppPayload;
    if (!payload || typeof payload !== 'object') {
      throw new Error('Claude returned invalid JSON');
    }
    return {
      payload,
      usage: buildUsage(message.usage)
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', jsonText);
    throw new Error('Claude returned invalid JSON');
  }
}
