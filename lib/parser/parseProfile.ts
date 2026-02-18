import type { ParsedAcademicInfo, ParsedDemographics, ParsedPersonalInfo, GenderIdentity } from './types';

const NAME_RE = /Name\s+([A-Za-z\-']+),\s+([A-Za-z\-']+)/;
const FALLBACK_NAME_RE = /^([A-Za-z\-']+),\s*([A-Za-z\-']+)/m;
const EMAIL_RE = /Email,?\s*Phone\s+([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/;
const PHONE_RE = /Email,?\s*Phone\s+\S+@\S+,\s*(\+?[\d.\-]+)/;
const ADDRESS_RE = /Permanent\s+address\s+(.+?),\s*([A-Z]{2}),?\s*(\d{5}(?:-\d{4})?)/;
const GENDER_RE = /Gender\s+Identity\s+(.+)/i;
const SEX_RE = /\bSex\s+(Male|Female)\b/i;
const HIGH_SCHOOL_RE = /(?:Current or most recent secondary school)\s*\n\s*(.+?)(?:,\s*\d|$)/i;
const GRAD_YEAR_RE = /Graduation\s+Date\s+(\d{2})\/(\d{4})/;
const GPA_RE = /GPA\s+([\d.]+)\s*\/\s*([\d.]+),?\s*(Weighted|Unweighted)?/i;
const CLASS_RANK_RE = /Rank\s+(\S+)\s*\/\s*(\d+)/i;
const SAT_RE = /SAT[^\n]*?(?:Total|Score)[:\s]+(\d{3,4})/i;
const ACT_RE = /ACT[^\n]*?(?:Composite|Score)[:\s]+(\d{1,2})/i;
const DEGREE_RE = /Bachelors|Bachelor's|Master|Doctorate|PhD/i;
const STREET_SUFFIXES = /(?:Rd|Road|St|Street|Ave|Avenue|Dr|Drive|Blvd|Boulevard|Ln|Lane|Ct|Court|Way|Pl|Place|Cir|Circle|Ter|Terrace|Pkwy|Parkway)\b/i;

const cleanLine = (value: string | null | undefined) => value?.trim() || null;
const parseNumber = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};
const normalizeGender = (value?: string | null): GenderIdentity | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('nonbinary') || normalized.includes('non-binary')) return 'non_binary';
  if (normalized.includes('prefer')) return 'prefer_not_to_say';
  if (normalized.includes('female')) return 'female';
  if (normalized.includes('male')) return 'male';
  if (normalized.includes('other')) return 'other';
  return null;
};

export function parseProfile(text: string): {
  personal: ParsedPersonalInfo;
  academic: ParsedAcademicInfo;
  demographics: ParsedDemographics;
} {
  const personal: ParsedPersonalInfo = {
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    streetAddress: null,
    city: null,
    state: null,
    zip: null
  };
  const academic: ParsedAcademicInfo = {
    highSchool: null,
    graduationYear: null,
    gpa: null,
    weightedGpa: null,
    satScore: null,
    actScore: null,
    classRank: null
  };
  const demographics: ParsedDemographics = {
    gender: null,
    firstGeneration: null
  };

  const nameMatch = NAME_RE.exec(text) || FALLBACK_NAME_RE.exec(text);
  if (nameMatch) {
    personal.lastName = cleanLine(nameMatch[1]);
    personal.firstName = cleanLine(nameMatch[2]);
  }

  personal.email = cleanLine(EMAIL_RE.exec(text)?.[1]);
  personal.phone = cleanLine(PHONE_RE.exec(text)?.[1]);

  const addressMatch = ADDRESS_RE.exec(text);
  if (addressMatch) {
    const rawStreetCity = addressMatch[1]?.replace(/\s+/g, ' ').trim() ?? '';
    personal.state = cleanLine(addressMatch[2]);
    personal.zip = cleanLine(addressMatch[3]);
    const suffixMatch = STREET_SUFFIXES.exec(rawStreetCity);
    if (suffixMatch) {
      const cut = suffixMatch.index + suffixMatch[0].length;
      personal.streetAddress = cleanLine(rawStreetCity.slice(0, cut));
      personal.city = cleanLine(rawStreetCity.slice(cut));
    } else {
      personal.streetAddress = cleanLine(rawStreetCity);
    }
  }

  const genderMatch = GENDER_RE.exec(text);
  demographics.gender = normalizeGender(genderMatch?.[1]);
  if (!demographics.gender) {
    const sexMatch = SEX_RE.exec(text);
    demographics.gender = normalizeGender(sexMatch?.[1]);
  }

  academic.highSchool = cleanLine(HIGH_SCHOOL_RE.exec(text)?.[1]);
  const gradMatch = GRAD_YEAR_RE.exec(text);
  academic.graduationYear = gradMatch ? parseNumber(gradMatch[2]) : null;

  const gpaMatch = GPA_RE.exec(text);
  if (gpaMatch) {
    const value = parseNumber(gpaMatch[1]);
    const scale = parseNumber(gpaMatch[2]) ?? 4;
    const normalized = value !== null ? Math.min(value * (4 / scale), 4) : null;
    if (gpaMatch[3]?.toLowerCase().includes('weighted')) {
      academic.weightedGpa = value;
      academic.gpa = normalized;
    } else {
      academic.gpa = normalized ?? value;
    }
  }

  const rankMatch = CLASS_RANK_RE.exec(text);
  if (rankMatch) {
    const rank = rankMatch[1]?.toLowerCase();
    if (rank && !['na', 'n/a', 'none', '-'].includes(rank)) {
      academic.classRank = `${rankMatch[1]}/${rankMatch[2]}`;
    }
  }

  const satScore = parseNumber(SAT_RE.exec(text)?.[1]);
  academic.satScore = satScore && satScore >= 400 && satScore <= 1600 ? satScore : null;
  const actScore = parseNumber(ACT_RE.exec(text)?.[1]);
  academic.actScore = actScore && actScore >= 1 && actScore <= 36 ? actScore : null;

  demographics.firstGeneration = DEGREE_RE.test(text) ? false : true;

  return { personal, academic, demographics };
}
