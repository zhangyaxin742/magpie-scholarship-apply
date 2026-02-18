import type { ParsedActivity } from './types';
import { truncateAtWord } from './utils';

const ACTIVITY_CATEGORIES = [
  'Career Oriented',
  'Work \(Paid\)',
  'Debate/Speech',
  'Music: Instrumental',
  'Music: Vocal',
  'Student Govt\./Politics',
  'Internship',
  'Research',
  'Community Service',
  'Athletics',
  'Academic',
  'Art',
  'Dance',
  'Theater',
  'Science/Math',
  'Computer/Technology',
  'Cultural',
  'Environmental',
  'Foreign Exchange',
  'Journalism/Publication',
  'Junior R\.O\.T\.C\.',
  'LGBTQ\+',
  'Religious',
  'School Spirit',
  'Social Justice',
  'Other Club',
  'Other Activity'
];
const CATEGORY_RE = new RegExp(`(?:^|\n)\s*(${ACTIVITY_CATEGORIES.join('|')})\s*\n`, 'gi');
const GRADES_RE = /^((?:9|10|11|12)(?:\s*,\s*(?:9|10|11|12))*)$/i;
const TIMING_RE = /^(School|Year|Break|School,\s*Break|School,\s*Year|School,\s*Year,\s*Break|Year,\s*Break)$/i;
const HOURS_WEEKS_RE = /(\d+)\s*hr\/wk,?\s*(\d+)\s*wk\/yr/i;
const TITLE_SPLIT_RE = /^(.+?),\s+([A-Z].+)$/;
const CONTINUE_RE = /^Continue$/i;

const parseGrades = (line: string): number[] => {
  const grades = line
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => value >= 9 && value <= 12);
  return Array.from(new Set(grades));
};

const buildDescriptions = (text: string) => {
  if (!text) {
    return { descriptionLong: null, descriptionMedium: null, descriptionShort: null };
  }
  const longValue = truncateAtWord(text, 500);
  return {
    descriptionLong: longValue,
    descriptionMedium: truncateAtWord(longValue, 150),
    descriptionShort: truncateAtWord(longValue, 50)
  };
};

const parseBlock = (block: string): ParsedActivity | null => {
  let lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !CONTINUE_RE.test(line));

  let grades: number[] = [];
  const gradeIndex = lines.findIndex((line) => GRADES_RE.test(line));
  if (gradeIndex >= 0) {
    grades = parseGrades(lines[gradeIndex] ?? '');
    lines.splice(gradeIndex, 1);
  }

  const timingIndex = lines.findIndex((line) => TIMING_RE.test(line));
  if (timingIndex >= 0) {
    lines.splice(timingIndex, 1);
  }

  let hoursPerWeek: number | null = null;
  let weeksPerYear: number | null = null;
  const hoursIndex = lines.findIndex((line) => HOURS_WEEKS_RE.test(line));
  if (hoursIndex >= 0) {
    const match = HOURS_WEEKS_RE.exec(lines[hoursIndex] ?? '');
    if (match) {
      hoursPerWeek = Number(match[1]);
      weeksPerYear = Number(match[2]);
    }
    lines.splice(hoursIndex, 1);
  }

  const titleLine = lines.shift();
  if (!titleLine) return null;

  const titleMatch = TITLE_SPLIT_RE.exec(titleLine);
  const position = titleMatch?.[1]?.trim() ?? null;
  const title = (titleMatch?.[2] ?? titleLine).trim();
  if (!title) return null;

  const descriptionText = lines.join(' ').replace(/\s+/g, ' ').trim();
  const { descriptionLong, descriptionMedium, descriptionShort } = buildDescriptions(descriptionText);

  return {
    title,
    position,
    descriptionLong,
    descriptionMedium,
    descriptionShort,
    hoursPerWeek: Number.isFinite(hoursPerWeek) ? hoursPerWeek : null,
    weeksPerYear: Number.isFinite(weeksPerYear) ? weeksPerYear : null,
    grades
  };
};

export function parseActivities(text: string): ParsedActivity[] {
  const matches = Array.from(text.matchAll(CATEGORY_RE));
  if (matches.length === 0) return [];

  const activities: ParsedActivity[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match || match.index === undefined) continue;
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const block = text.slice(start, end).trim();
    if (!block) continue;
    const activity = parseBlock(block);
    if (activity) activities.push(activity);
  }

  return activities;
}
