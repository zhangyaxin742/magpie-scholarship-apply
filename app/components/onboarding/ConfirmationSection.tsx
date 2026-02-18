'use client';

import type { ReactNode } from 'react';

interface ConfirmationSectionProps {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}

export function ConfirmationSection({ title, actionLabel, onAction, children }: ConfirmationSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h3>
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {actionLabel}
        </button>
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-600">{children}</div>
    </section>
  );
}
