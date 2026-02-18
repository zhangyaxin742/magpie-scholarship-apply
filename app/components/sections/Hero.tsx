'use client';

import { SignUpButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';

import { StatCard } from '../ui/StatCard';

const stats = [
  { number: '$43K', label: 'avg found per student' },
  { number: '12', label: 'scholarships applied' },
  { number: '5min', label: 'setup to first match' }
];

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white pt-32 pb-20">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-8"
        >
          <h1 className="text-4xl font-black text-slate-900 md:text-5xl lg:text-6xl">
            Stop{' '}
            <span className="relative inline-block text-slate-400 line-through">
              applying to
            </span>{' '}
            Start winning scholarships
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Upload your Common App once. Find local scholarships with real win
            rates. Apply in minutes, not hours.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SignUpButton mode="modal" redirectUrl="/onboarding">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Start Finding Money
              </motion.button>
            </SignUpButton>
            <a
              href="#how-it-works"
              className="rounded-full border border-slate-200 px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              See how it works
            </a>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-64 w-64 items-center justify-center rounded-full bg-white shadow-xl"
          >
            <svg
              viewBox="0 0 120 120"
              role="img"
              aria-label="Magpie mascot illustration"
              className="h-40 w-40"
            >
              <circle cx="60" cy="60" r="48" fill="#0f172a" />
              <path
                d="M32 70c0-17.673 14.327-32 32-32 9.24 0 17.56 3.91 23.36 10.16-7.02-.18-12.58 1.39-16.7 4.71-4.12 3.32-7.08 8.74-8.9 16.26C44.26 78.61 32 72.73 32 70z"
                fill="#2563eb"
              />
              <path
                d="M89 47l18-5-12 14"
                stroke="#f8fafc"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="68" cy="54" r="4" fill="#f8fafc" />
              <path
                d="M41 87c6 5 14 7.5 23.5 7.5 6 0 11.5-.8 16.5-2.3-7 8.4-17.4 13.8-29 13.8-15.4 0-28.2-9.1-32.8-21.4C29 87.3 35.5 88.4 41 87z"
                fill="#f8fafc"
              />
            </svg>
          </motion.div>
          <p className="mt-6 text-sm font-medium text-slate-500">
            30-second Common App import
          </p>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        className="mx-auto mt-16 grid w-full max-w-5xl gap-6 px-4 md:grid-cols-3 lg:px-8"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} number={stat.number} label={stat.label} />
        ))}
      </motion.div>
    </section>
  );
}
