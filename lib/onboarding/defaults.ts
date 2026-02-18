import type { OnboardingData } from './types';

const currentYear = new Date().getFullYear();

export const emptyOnboardingData: OnboardingData = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  },
  academic: {
    highSchool: '',
    graduationYear: currentYear < 2024 ? 2024 : currentYear,
    gpa: '',
    weightedGpa: '',
    sat: '',
    act: '',
    classRank: ''
  },
  activities: [],
  essays: []
};
