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
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 letters'),
  zip: z.string().optional()
});

export const academicInfoSchema = z.object({
  highSchool: z.string().min(1, 'High school is required'),
  graduationYear: z.coerce
    .number()
    .int()
    .min(2024, 'Graduation year must be between 2024 and 2035')
    .max(2035, 'Graduation year must be between 2024 and 2035'),
  gpa: optionalNumberString(0, 5, 'GPA'),
  weightedGpa: optionalNumberString(0, 5, 'Weighted GPA'),
  sat: optionalNumberString(400, 1600, 'SAT score'),
  act: optionalNumberString(1, 36, 'ACT score'),
  classRank: z.string().optional()
});

export const activitySchema = z.object({
  title: z.string().min(1, 'Activity title is required'),
  position: z.string().optional(),
  description: z.string().optional(),
  hoursPerWeek: z.coerce.number().min(0).max(40).optional(),
  weeksPerYear: z.coerce.number().min(0).max(52).optional(),
  grades: z.array(z.coerce.number().int()).optional()
});

export const essaySchema = z.object({
  topic: z.string().min(1, 'Essay topic is required'),
  text: z.string().min(1, 'Essay text is required'),
  wordCount: z.number().optional()
});

export const onboardingDataSchema = z.object({
  personal: personalInfoSchema,
  academic: academicInfoSchema,
  activities: z.array(activitySchema).max(10),
  essays: z.array(essaySchema).max(5)
});

export const preferencesSchema = z.object({
  firstGen: z.enum(['yes', 'no', 'prefer_not']).optional(),
  incomeRange: z.enum(['under_30k', '30_60k', '60_100k', 'over_100k', 'prefer_not']).optional(),
  ethnicity: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not', 'self_describe']).optional(),
  genderOther: z.string().optional()
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
