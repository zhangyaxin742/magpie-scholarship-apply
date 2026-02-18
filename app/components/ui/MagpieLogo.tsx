import type { ComponentPropsWithoutRef } from 'react';

interface MagpieLogoProps extends ComponentPropsWithoutRef<'svg'> {
  className?: string;
}

export function MagpieLogo({ className, ...props }: MagpieLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Magpie logo"
      role="img"
      {...props}
    >
      <circle cx="20" cy="20" r="19" fill="#0f172a" />
      <path
        d="M10 22c0-5.523 4.477-10 10-10 3.515 0 6.61 1.815 8.4 4.56-2.97-.05-5.35.645-7.12 2.085-1.77 1.44-3.065 3.765-3.89 6.975C13.63 25.02 10 23.07 10 22z"
        fill="#2563eb"
      />
      <path
        d="M29.6 16.56l4.6-1.2-3.1 3.3"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="18.5" r="1.5" fill="#f8fafc" />
      <path
        d="M14 27c2.4 2 5.6 3 9.4 3 2.2 0 4.2-.3 6-.9-2.6 3-6.4 4.9-10.7 4.9-5.75 0-10.5-3.4-12.2-8 2.5 1.2 5 1.5 7.5 1z"
        fill="#f8fafc"
      />
    </svg>
  );
}
