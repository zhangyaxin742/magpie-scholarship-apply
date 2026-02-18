'use client';

import { motion } from 'framer-motion';
import { MapPin, Target, Zap } from 'lucide-react';

import { FeatureCard } from '../ui/FeatureCard';

const features = [
  {
    step: '01',
    title: 'Import in 30 seconds',
    description:
      'Upload your Common App PDF and we auto-fill your profile instantly.',
    highlight: 'Never type your GPA again.',
    icon: <Zap className="h-6 w-6 text-blue-600" aria-hidden="true" />
  },
  {
    step: '02',
    title: 'Discover local money',
    description:
      'We surface scholarships from Rotary clubs, foundations, and local businesses.',
    highlight: '20-100 applicants, not 50,000.',
    icon: <MapPin className="h-6 w-6 text-blue-600" aria-hidden="true" />
  },
  {
    step: '03',
    title: 'Apply in one click',
    description:
      'Reuse essays, track deadlines, and know exactly what you submitted.',
    highlight: 'From profile to first application in 5 minutes.',
    icon: <Target className="h-6 w-6 text-blue-600" aria-hidden="true" />
  }
];

export default function FeaturesSection() {
  return (
    <motion.section
      id="how-it-works"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="scroll-mt-24 bg-white py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            How Magpie works
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            A scholarship workflow built for real life
          </h2>
          <p className="max-w-2xl text-lg text-slate-600">
            Find the scholarships with real win rates, then apply once without
            losing your weekends.
          </p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.step} {...feature} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
