import type { OnboardingData } from './types';

const currentYear = new Date().getFullYear();

export const emptyOnboardingData: OnboardingData = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: ''
  },
  academic: {
    highSchool: '',
    graduationYear: currentYear < 2020 ? 2020 : currentYear,
    gpa: '',
    weightedGpa: '',
    satScore: '',
    actScore: '',
    classRank: ''
  },
  activities: [],
  essays: []
};
