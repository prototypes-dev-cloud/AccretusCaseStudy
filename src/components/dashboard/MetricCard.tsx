import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accentColor?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = '#1e3a5f',
  onClick,
}: MetricCardProps) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className="p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                'inline-flex items-center gap-1 mt-2 text-xs font-medium',
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3"
          style={{ backgroundColor: accentColor + '15' }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
    </Card>
  );
}
