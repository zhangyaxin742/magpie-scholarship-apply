'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  number: string;
  label: string;
}

export function StatCard({ number, label }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-slate-100 bg-white px-6 py-5 text-center shadow-sm"
    >
      <div className="text-4xl font-black text-blue-600">{number}</div>
      <div className="mt-2 text-sm font-medium text-slate-600">{label}</div>
    </motion.div>
  );
}
