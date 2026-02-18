import { emptyOnboardingData } from './onboarding/defaults';
import type { OnboardingData } from './onboarding/types';

interface ParseResult {
  data: OnboardingData;
  errors: string[];
}

const findMatch = (text: string, regex: RegExp) => {
  const match = text.match(regex);
  return match?.[1]?.trim() ?? '';
};

export function parseCommonApp(text: string): ParseResult {
  const data: OnboardingData = JSON.parse(JSON.stringify(emptyOnboardingData));
  const errors: string[] = [];

  data.personal.firstName = findMatch(text, /First Name\s*[:\-]\s*(.+)/i) ||
    findMatch(text, /Student Name\s*[:\-]\s*(\w+)/i);
  data.personal.lastName = findMatch(text, /Last Name\s*[:\-]\s*(.+)/i) ||
    findMatch(text, /Student Name\s*[:\-]\s*\w+\s+(\w+)/i);
  data.personal.email = findMatch(text, /Email\s*[:\-]\s*([\w.%+-]+@[\w.-]+\.[A-Za-z]{2,})/i) ||
    findMatch(text, /([\w.%+-]+@[\w.-]+\.[A-Za-z]{2,})/i);
  data.personal.phone = findMatch(text, /Phone\s*[:\-]\s*([\d\-()+\s]{7,})/i);
  data.personal.address = findMatch(text, /Address\s*[:\-]\s*(.+)/i);

  const cityStateZip = text.match(/([A-Za-z .]+),\s*([A-Z]{2})\s*(\d{5})?/);
  if (cityStateZip) {
    data.personal.city = cityStateZip[1]?.trim() ?? '';
    data.personal.state = cityStateZip[2]?.trim() ?? '';
    data.personal.zip = cityStateZip[3]?.trim() ?? '';
  }

  data.academic.highSchool = findMatch(text, /High School\s*[:\-]\s*(.+)/i);
  const graduationYear = findMatch(text, /(Graduation Year|Class of)\s*[:\-]?\s*(\d{4})/i) || '';
  data.academic.graduationYear = graduationYear ? Number(graduationYear.match(/\d{4}/)?.[0]) : data.academic.graduationYear;
  data.academic.gpa = findMatch(text, /GPA\s*[:\-]\s*([0-5]\.?\d{0,2})/i);
  data.academic.weightedGpa = findMatch(text, /Weighted GPA\s*[:\-]\s*([0-5]\.?\d{0,2})/i);
  data.academic.sat = findMatch(text, /SAT\s*[:\-]\s*(\d{3,4})/i);
  data.academic.act = findMatch(text, /ACT\s*[:\-]\s*(\d{1,2})/i);
  data.academic.classRank = findMatch(text, /Class Rank\s*[:\-]\s*([\d/]+)/i);

  if (!data.personal.firstName || !data.personal.lastName) {
    errors.push('Name not found');
  }
  if (!data.personal.email) {
    errors.push('Email not found');
  }
  if (!data.academic.highSchool) {
    errors.push('High school not found');
  }

  return { data, errors };
}

export function calculateConfidence(data: OnboardingData): number {
  const checks = [
    data.personal.firstName,
    data.personal.lastName,
    data.personal.email,
    data.personal.city,
    data.personal.state,
    data.academic.highSchool,
    data.academic.graduationYear?.toString(),
    data.academic.gpa
  ];

  const filled = checks.filter((value) => value && value.trim?.() !== '').length;
  return Number((filled / checks.length).toFixed(2));
}
