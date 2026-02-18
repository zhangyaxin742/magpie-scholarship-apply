import * as z from 'zod';

const optionalNumberString = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const parsed = Number(value);
        return !Number.isNaN(parsed) && parsed >= min && parsed <= max;
      },
      {
        message: `${label} must be between ${min} and ${max}`
      }
    );

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 letters'),
  zip: z.string().optional()
});

export const academicInfoSchema = z.object({
  highSchool: z.string().min(1, 'High school is required'),
  graduationYear: z.coerce
    .number()
    .int()
    .min(2020, 'Graduation year must be between 2020 and 2035')
    .max(2035, 'Graduation year must be between 2020 and 2035'),
  gpa: optionalNumberString(0, 5, 'GPA'),
  weightedGpa: optionalNumberString(0, 5, 'Weighted GPA'),
  satScore: optionalNumberString(400, 1600, 'SAT score'),
  actScore: optionalNumberString(1, 36, 'ACT score'),
  classRank: z.string().optional()
});

export const activitySchema = z.object({
  title: z.string().min(1, 'Activity title is required'),
  position: z.string().optional(),
  descriptionShort: z.string().max(50).optional(),
  descriptionMedium: z.string().max(150).optional(),
  descriptionLong: z.string().max(500).optional(),
  hoursPerWeek: z.coerce.number().min(0).max(168).optional(),
  weeksPerYear: z.coerce.number().min(0).max(52).optional(),
  grades: z.array(z.coerce.number().int().min(9).max(12)).max(4).optional()
});

export const essaySchema = z.object({
  topic: z.enum([
    'personal_statement',
    'leadership',
    'challenge',
    'community_service',
    'diversity',
    'career_goals',
    'academic_interest',
    'extracurricular',
    'work_experience',
    'other'
  ]),
  text: z.string().min(1, 'Essay text is required'),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  wordCount: z.number().min(1).max(10000).optional()
});

export const onboardingDataSchema = z.object({
  personal: personalInfoSchema,
  academic: academicInfoSchema,
  activities: z.array(activitySchema).max(10),
  essays: z.array(essaySchema).max(5)
});

export const preferencesSchema = z.object({
  firstGen: z.boolean().optional(),
  incomeRange: z.enum(['under_30k', '30k_60k', '60k_100k', 'over_100k']).optional(),
  ethnicity: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say', 'other']).optional()
});

export const manualOnboardingSchema = z.object({
  personal: personalInfoSchema,
  academic: academicInfoSchema,
  activities: z.array(activitySchema).max(10),
  essays: z.array(essaySchema).max(5)
});

export type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
export type AcademicInfoForm = z.infer<typeof academicInfoSchema>;
export type ManualOnboardingForm = z.infer<typeof manualOnboardingSchema>;
