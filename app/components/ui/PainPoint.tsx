interface PainPointProps {
  emoji: string;
  title: string;
  description: string;
}

export function PainPoint({ emoji, title, description }: PainPointProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-slate-800 px-6 py-5">
      <div className="text-3xl" aria-hidden="true">
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300">{description}</p>
    </div>
  );
}
