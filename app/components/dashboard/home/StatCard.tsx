interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  tone?: 'blue' | 'green' | 'purple' | 'indigo';
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  indigo: 'text-indigo-600'
};

export function StatCard({ label, value, helper, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className={`text-2xl font-black ${toneStyles[tone]}`}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{label}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
