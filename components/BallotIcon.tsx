export function BallotIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-5 9 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="3" y="9" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 14.5l2 2 4-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
