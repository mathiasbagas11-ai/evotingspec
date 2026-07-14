import { ORG_NAME, ORG_PERIOD } from '@/lib/brand';
import { BallotIcon } from './BallotIcon';

export function BrandHeader({
  subtitle,
  compact = false,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        }`}
      >
        <BallotIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>
      <div>
        <div className="text-sm font-semibold leading-tight text-gray-900">{ORG_NAME}</div>
        <div className="text-xs leading-tight text-gray-500">{subtitle ?? ORG_PERIOD}</div>
      </div>
    </div>
  );
}
