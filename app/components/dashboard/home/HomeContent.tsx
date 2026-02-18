'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeDollarSign,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  PenLine,
  Search,
  Sparkles
} from 'lucide-react';

import { StatCard } from './StatCard';

interface UpcomingDeadline {
  id: string;
  name: string;
  deadline: string;
  amount: number | null;
  status: string;
}

interface HomeContentProps {
  firstName?: string | null;
  city?: string | null;
  state?: string | null;
  gpa?: string | null;
  cartCount: number;
  appliedCount: number;
  wonCount: number;
  totalPotential: number;
  amountWon: number;
  upcomingDeadlines: UpcomingDeadline[];
  newMatchesCount: number;
  urgentDeadline: UpcomingDeadline | null;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('en-US');

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});

export function HomeContent({
  firstName,
  city,
  state,
  gpa,
  cartCount,
  appliedCount,
  wonCount,
  totalPotential,
  amountWon,
  upcomingDeadlines,
  newMatchesCount,
  urgentDeadline
}: HomeContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const greetingName = firstName ? firstName.trim() : 'there';
  const locationLabel = [city, state].filter(Boolean).join(', ');
  const profileDetail = [locationLabel, gpa ? `GPA ${gpa}` : null].filter(Boolean).join(' · ');
  const isFirstTime = cartCount === 0 && appliedCount === 0 && wonCount === 0 && newMatchesCount === 0;

  const stats = [
    {
      label: 'Potential in cart',
      value: totalPotential ? currencyFormatter.format(totalPotential) : '$0',
      helper: cartCount ? `${cartCount} saved scholarships` : 'Add scholarships to your cart',
      tone: 'purple' as const
    },
    {
      label: 'In cart',
      value: numberFormatter.format(cartCount),
      helper: cartCount ? 'Ready to apply' : 'Start saving scholarships',
      tone: 'blue' as const
    },
    {
      label: 'Applied',
      value: numberFormatter.format(appliedCount),
      helper: appliedCount ? 'Applications submitted' : 'Track what you apply to',
      tone: 'indigo' as const
    },
    {
      label: 'Won',
      value: numberFormatter.format(wonCount),
      helper: amountWon ? `${currencyFormatter.format(amountWon)} awarded` : 'Celebrate your wins',
      tone: 'green' as const
    }
  ];

  const urgentDays = urgentDeadline
    ? Math.ceil(
        (new Date(urgentDeadline.deadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const motionContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06
      }
    }
  };

  const motionItem = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
            Welcome back, {greetingName}.
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {profileDetail
              ? `Profile snapshot: ${profileDetail}.`
              : 'Complete your profile to unlock better local matches.'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{newMatchesCount} new matches</p>
          <p className="mt-1">We&apos;ll keep scouting scholarships daily.</p>
        </div>
      </header>

      {urgentDeadline ? (
        <motion.div
          className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 0 0 0 rgba(248,113,113,0.25)',
                    '0 0 0 8px rgba(248,113,113,0.1)',
                    '0 0 0 0 rgba(248,113,113,0.25)'
                  ]
                }
          }
          transition={{ duration: 2.2, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Deadline alert</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                {urgentDeadline.name} is due in {urgentDays} day{urgentDays === 1 ? '' : 's'}.
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Submit your application by {dateFormatter.format(new Date(urgentDeadline.deadline))}.
              </p>
            </div>
            <Link
              href="/dashboard/cart"
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              View cart
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      ) : null}

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={motionContainer}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={motionItem}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-6 text-white shadow-lg md:p-7">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-100">
              <Sparkles className="h-4 w-4" />
              New matches
            </div>
            <h2 className="mt-3 text-2xl font-semibold">
              {newMatchesCount > 0
                ? `${newMatchesCount} scholarships just matched your profile.`
                : 'No fresh matches yet — keep checking back.'}
            </h2>
            <p className="mt-2 text-sm text-blue-100">
              Update your profile to surface higher win-rate local scholarships.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/search"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                Browse matches
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                Edit profile
                <GraduationCap className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next steps</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link
                href="/dashboard/search"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Find scholarships
                <Search className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
              </Link>
              <Link
                href="/dashboard/knowledge"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Add essays
                <PenLine className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
              </Link>
              <Link
                href="/dashboard/cart"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Review cart
                <ClipboardCheck className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
              </Link>
            </div>
          </div>

          {isFirstTime ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <BadgeDollarSign className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Your scholarship hub is ready.</h3>
              <p className="mt-2 text-sm text-slate-600">
                Start by saving a scholarship or uploading your essays so Magpie can auto-fill faster.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard/search"
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Find scholarships
                </Link>
                <Link
                  href="/dashboard/knowledge"
                  className="rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Add essays
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Upcoming deadlines</h3>
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            {upcomingDeadlines.length ? (
              <div className="mt-4 space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{deadline.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Due {dateFormatter.format(new Date(deadline.deadline))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {deadline.amount ? currencyFormatter.format(deadline.amount) : '—'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{deadline.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No upcoming deadlines yet. Add scholarships to your cart to track them here.
              </div>
            )}
            <Link
              href="/dashboard/cart"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View cart
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Goal tracker</h3>
              <BadgeDollarSign className="h-5 w-5 text-blue-200" />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              You&apos;ve applied to {appliedCount} scholarships so far. Keep momentum by applying to 2 more this
              month.
            </p>
            <Link
              href="/dashboard/search"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Find more
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
