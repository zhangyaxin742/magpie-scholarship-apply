'use client';

import { motion } from 'framer-motion';

import { PainPoint } from '../ui/PainPoint';

const painPoints = [
  {
    emoji: '📝',
    title: 'Same essay, 47 times.',
    description: 'You rewrite the same story for every scholarship. Again and again.'
  },
  {
    emoji: '😩',
    title: '50 hours of busywork.',
    description: 'Each application is 45 minutes. Multiply by 50 scholarships.'
  },
  {
    emoji: '📭',
    title: 'No feedback, ever.',
    description: 'Most applications disappear without a rejection or update.'
  },
  {
    emoji: '🔍',
    title: 'Local money is hidden.',
    description: 'The best scholarships live on obscure community websites.'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProblemSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-slate-900 py-20 text-white"
    >
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <h2 className="text-3xl font-bold md:text-4xl">You know the drill...</h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          You&apos;re doing everything right, but the system is stacked against you.
        </p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-120px' }}
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {painPoints.map((point) => (
            <motion.div key={point.title} variants={itemVariants}>
              <PainPoint
                emoji={point.emoji}
                title={point.title}
                description={point.description}
              />
            </motion.div>
          ))}
        </motion.div>
        <p className="mt-10 text-xl font-semibold text-white">
          The scholarship game is broken. We&apos;re fixing it. 🔧
        </p>
      </div>
    </motion.section>
  );
}
