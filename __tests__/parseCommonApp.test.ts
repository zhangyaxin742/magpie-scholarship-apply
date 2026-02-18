import { describe, expect, it } from 'vitest';
import { parseProfile } from '@/lib/parser/parseProfile';
import { parseActivities } from '@/lib/parser/parseActivities';
import { parseEssays } from '@/lib/parser/parseEssays';
import { parseCommonApp } from '@/lib/parser/parseCommonApp';
import { truncateAtWord } from '@/lib/parser/utils';

const profileText = `Name Doe, Jane
Email, Phone jane@example.com, +1-555-1234
Permanent address 123 Main St Springfield, CA, 90210, USA
Gender Identity Female
Current or most recent secondary school
Springfield High School, 123
Graduation Date 06/2026
GPA 4.5 / 5, Weighted
Rank 12 / 350
SAT Total 1400
ACT Composite 30
Mother Education Bachelors
`;

const activityCategories = [
  'Career Oriented',
  'Work (Paid)',
  'Debate/Speech',
  'Music: Instrumental',
  'Student Govt./Politics',
  'Internship',
  'Community Service',
  'Athletics',
  'Academic',
  'Other Activity'
];

const buildActivitiesText = () =>
  activityCategories
    .map(
      (category, index) => `${category}
9, 10, 11, 12
School
${10 + index} hr/wk, 38 wk/yr
President, Activity ${index + 1}
Led initiatives for activity ${index + 1} with impact.`
    )
    .join('\n');

const essaysText = `Personal essay
Some prompt text that asks you to share your story.
Please share your story
This is my personal statement text.
Additional information
Use this space to share any additional information
Here is extra info for reviewers.
Certification
`;

describe('parseProfile', () => {
  it('extracts personal, academic, and demographics fields', () => {
    const result = parseProfile(profileText);

    expect(result.personal.firstName).toBe('Jane');
    expect(result.personal.lastName).toBe('Doe');
    expect(result.personal.email).toBe('jane@example.com');
    expect(result.personal.phone).toBe('+1-555-1234');
    expect(result.personal.streetAddress).toBe('123 Main St');
    expect(result.personal.city).toBe('Springfield');
    expect(result.personal.state).toBe('CA');
    expect(result.personal.zip).toBe('90210');

    expect(result.academic.highSchool).toBe('Springfield High School');
    expect(result.academic.graduationYear).toBe(2026);
    expect(result.academic.weightedGpa).toBeCloseTo(4.5, 2);
    expect(result.academic.gpa).toBeCloseTo(3.6, 2);
    expect(result.academic.classRank).toBe('12/350');
    expect(result.academic.satScore).toBe(1400);
    expect(result.academic.actScore).toBe(30);

    expect(result.demographics.gender).toBe('female');
    expect(result.demographics.firstGeneration).toBe(false);
  });
});

describe('parseActivities', () => {
  it('extracts all activities and core fields', () => {
    const activities = parseActivities(buildActivitiesText());

    expect(activities).toHaveLength(10);
    expect(activities[0]).toMatchObject({
      title: 'Activity 1',
      position: 'President',
      hoursPerWeek: 10,
      weeksPerYear: 38,
      grades: [9, 10, 11, 12]
    });
    expect(activities[0]?.descriptionLong).toContain('Led initiatives');
  });
});

describe('parseEssays', () => {
  it('extracts personal statement and additional info essays', () => {
    const essays = parseEssays(essaysText);

    expect(essays).toHaveLength(2);
    expect(essays[0]).toMatchObject({
      topic: 'personal_statement',
      text: 'This is my personal statement text.'
    });
    expect(essays[1]).toMatchObject({
      topic: 'other',
      text: 'Here is extra info for reviewers.'
    });
    expect(essays[1]?.tags).toEqual(['common_app', 'additional_info']);
  });
});

describe('parseCommonApp', () => {
  it('calculates confidence across all 17 signals', () => {
    const fullText = `${profileText}\n${buildActivitiesText()}\n${essaysText}`;
    const result = parseCommonApp(fullText);

    expect(result.success).toBe(true);
    expect(result.confidence).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('handles empty and garbage text', () => {
    const emptyResult = parseCommonApp('');
    expect(emptyResult.confidence).toBe(0);
    expect(emptyResult.errors).toHaveLength(17);

    const garbageResult = parseCommonApp('??? random text ???');
    expect(garbageResult.success).toBe(true);
    expect(garbageResult.confidence).toBe(0);
  });
});

describe('truncateAtWord', () => {
  it('truncates at the last full word', () => {
    expect(truncateAtWord('The quick brown fox', 10)).toBe('The quick');
    expect(truncateAtWord('Short text', 50)).toBe('Short text');
  });
});
