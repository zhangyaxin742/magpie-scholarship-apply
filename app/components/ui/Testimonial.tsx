interface TestimonialProps {
  quote: string;
  author: string;
  school: string;
  amount: string;
}

export function Testimonial({ quote, author, school, amount }: TestimonialProps) {
  return (
    <article className="rounded-3xl border-2 border-slate-100 bg-white p-6 shadow-lg">
      <div className="text-3xl" aria-hidden="true">
        💬
      </div>
      <p className="mt-4 text-base italic text-slate-700">“{quote}”</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{author}</p>
          <p className="text-sm text-slate-500">{school}</p>
        </div>
        <div className="text-2xl font-black text-green-600">{amount}</div>
      </div>
    </article>
  );
}
