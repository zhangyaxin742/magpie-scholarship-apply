'use client';

import { motion } from 'framer-motion';

import { Testimonial } from '../ui/Testimonial';

const testimonials = [
  {
    quote:
      'I applied to 200+ scholarships on Bold.org. Won nothing. Applied to 12 on Magpie. Won 3. $8,500 total.',
    author: 'Sarah J.',
    school: "UCLA '28",
    amount: '$8,500'
  },
  {
    quote:
      "Finally found scholarships that aren't flooded with applicants. Actually won money from my local Rotary club.",
    author: 'Marcus T.',
    school: "Howard '27",
    amount: '$5,000'
  },
  {
    quote:
      'The Common App import saved me SO much time. Went from profile to first application in literally 5 minutes.',
    author: 'Priya M.',
    school: "Berkeley '26",
    amount: '$12,000'
  }
];

export default function TestimonialsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-slate-50 py-20"
    >
      <div className="mx-auto w-full max-w-4xl px-4 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Real students, real money
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Proof that local scholarships beat national lotteries every time.
        </p>
        <div className="mt-10 flex flex-col gap-6">
          {testimonials.map((testimonial) => (
            <Testimonial key={testimonial.author} {...testimonial} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
