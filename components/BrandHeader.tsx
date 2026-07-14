import { ORG_NAME, ORG_PERIOD } from '@/lib/brand';
import { BallotIcon } from './BallotIcon';

export function BrandHeader({
  subtitle,
  compact = false,
  onDark = false,
}: {
  subtitle?: string;
  compact?: boolean;
  onDark?: boolean;
}) {
  const title = onDark ? 'text-white' : 'text-gray-900';
  const sub = onDark ? 'text-white/60' : 'text-gray-500';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-forest-accent text-forest-deep shadow-lg shadow-black/20 ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        }`}
      >
        <BallotIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>
      <div>
        <div className={`text-sm font-semibold leading-tight ${title}`}>{ORG_NAME}</div>
        <div className={`text-xs leading-tight ${sub}`}>{subtitle ?? ORG_PERIOD}</div>
      </div>
    </div>
  );
}
