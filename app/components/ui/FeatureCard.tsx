'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  step: string;
  title: string;
  description: string;
  highlight: string;
}

export function FeatureCard({
  icon,
  step,
  title,
  description,
  highlight
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group rounded-3xl border-2 border-slate-100 bg-white p-8 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-400">{step}</span>
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
      <p className="mt-4 text-sm font-semibold text-blue-600">{highlight}</p>
    </motion.div>
  );
}
