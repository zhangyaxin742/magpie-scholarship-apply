import type { ParsedEssay } from './types';
import { extractSection } from './utils';

const PERSONAL_ESSAY_START_RE = /Personal\s+essay/i;
const ADDITIONAL_INFO_START_RE = /Additional\s+information/i;
const ADDITIONAL_INFO_END_RE = /(?:Certification|Signature|Disciplinary|FERPA|Parent|Counselor|Teacher|School\s+Report|Application\s+Fee)/i;
const PROMPT_END_RE = /(?:share your\s*story|please share your story)\s*\.?\s*\n/i;
const ADDITIONAL_PROMPT_RE = /(?:use this space|share any additional information|provide additional information)[^\n]*\n/i;

const TOPIC_PATTERNS: Record<ParsedEssay['topic'], RegExp[]> = {
  personal_statement: [/background.*identity.*interest.*talent/i, /share your story/i],
  challenge: [/lessons.*failure/i, /obstacle.*setback/i],
  leadership: [/captivat.*happy.*content.*engaged/i],
  community_service: [/community.*you.*belong/i],
  diversity: [/diversity.*background/i],
  academic_interest: [/topic.*idea.*concept.*captivate/i],
  extracurricular: [],
  work_experience: [],
  career_goals: [],
  other: []
};

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const detectTopic = (promptText: string): ParsedEssay['topic'] => {
  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS) as [ParsedEssay['topic'], RegExp[]][]) {
    if (patterns.some((pattern) => pattern.test(promptText))) {
      return topic;
    }
  }
  return 'personal_statement';
};

const buildEssay = (topic: ParsedEssay['topic'], text: string, tags: string[] = []): ParsedEssay => ({
  topic,
  title: null,
  text,
  wordCount: countWords(text),
  tags
});

export function parseEssays(text: string): ParsedEssay[] {
  const essays: ParsedEssay[] = [];
  const personalSection = extractSection(text, PERSONAL_ESSAY_START_RE, ADDITIONAL_INFO_START_RE);

  if (personalSection) {
    let promptText = personalSection;
    let essayText = personalSection;
    const promptMatch = PROMPT_END_RE.exec(personalSection);
    if (promptMatch && promptMatch.index !== undefined) {
      promptText = personalSection.slice(0, promptMatch.index + promptMatch[0].length);
      essayText = personalSection.slice(promptMatch.index + promptMatch[0].length);
    } else {
      essayText = personalSection.replace(PERSONAL_ESSAY_START_RE, '');
    }
    essayText = essayText.trim();
    if (essayText) {
      essays.push(buildEssay(detectTopic(promptText), essayText, ['common_app']));
    }
  }

  const additionalSection = extractSection(text, ADDITIONAL_INFO_START_RE, ADDITIONAL_INFO_END_RE);
  if (additionalSection) {
    let additionalText = additionalSection.replace(ADDITIONAL_INFO_START_RE, '').trim();
    const promptMatch = ADDITIONAL_PROMPT_RE.exec(additionalText);
    if (promptMatch && promptMatch.index !== undefined) {
      additionalText = additionalText.slice(promptMatch.index + promptMatch[0].length).trim();
    }
    if (additionalText) {
      essays.push(buildEssay('other', additionalText, ['common_app', 'additional_info']));
    }
  }

  return essays;
}
