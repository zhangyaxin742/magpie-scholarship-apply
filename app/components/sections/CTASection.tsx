'use client';

import { SignUpButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';

import { ClerkButton } from '../ui/ClerkButton';

const MotionClerkButton = motion(ClerkButton);

export default function CTASection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 py-20 text-white"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-white/20 blur-3xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl"
        animate={{ y: [0, 25, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 lg:px-8">
        <h2 className="text-3xl font-black md:text-4xl">
          Stop grinding. Start winning. 💰
        </h2>
        <p className="max-w-2xl text-lg text-white/90">
          Magpie finds the scholarships you can actually win, then takes the
          busywork off your plate.
        </p>
        <SignUpButton
          mode="modal"
          forceRedirectUrl="/onboarding"
          signInForceRedirectUrl="/onboarding"
        >
          <MotionClerkButton
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 shadow-xl transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
          >
            Get Started Free
          </MotionClerkButton>
        </SignUpButton>
        <p className="text-sm font-semibold text-white/80">
          No credit card • 5min setup • Actually free
        </p>
      </div>
    </motion.section>
  );
}
