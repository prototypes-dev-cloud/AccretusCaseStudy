import { cn, daysUntil, getDeadlinePillStyle } from '@/lib/utils';
import { Clock, CheckCircle2 } from 'lucide-react';

interface CountdownPillProps {
  label: string;
  dateStr: string;
  isPast?: boolean;
}

export function CountdownPill({ label, dateStr, isPast }: CountdownPillProps) {
  const days = daysUntil(dateStr);
  const { bg, text } = getDeadlinePillStyle(days);

  if (isPast || days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        <CheckCircle2 className="w-3 h-3" />
        Passed
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        bg,
        text
      )}
      title={`${label}: ${days} days remaining`}
    >
      <Clock className="w-3 h-3" />
      {days}d left
    </span>
  );
}
