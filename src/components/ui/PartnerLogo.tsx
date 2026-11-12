import { cn } from '@/lib/utils';

interface PartnerLogoProps {
  initials: string;
  color: string;
  logoPath?: string;   // e.g. "logos/apex-cpa.svg" — served via /api/logos/:filename
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Set true when rendering inside a context that already sends auth headers.
   *  Logo images are fetched via /api/logos which requires X-Role header — but
   *  img tags can't set custom headers. We use a Next.js API route that checks
   *  the header OR falls back gracefully so the UI still works. */
  variant?: 'badge' | 'full';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const imgSizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function PartnerLogo({
  initials,
  color,
  logoPath,
  size = 'md',
  className,
  variant = 'badge',
}: PartnerLogoProps) {
  // Extract just the filename from the stored path ("logos/apex-cpa.svg" → "apex-cpa.svg")
  const filename = logoPath ? logoPath.split('/').pop() : null;

  if (filename && variant === 'full') {
    // Full logo image (rectangular, used in reports and partner cards)
    return (
      <img
        src={`/api/logos/${filename}`}
        alt={`${initials} logo`}
        className={cn('object-contain rounded', className)}
        onError={(e) => {
          // Fallback to initials badge if image fails to load
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  if (filename && variant === 'badge') {
    // Square badge with logo image
    return (
      <div
        className={cn(
          'rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0',
          imgSizeClasses[size],
          className
        )}
        aria-label={`${initials} logo`}
      >
        <img
          src={`/api/logos/${filename}`}
          alt={`${initials} logo`}
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            // On load failure replace with the initials div
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.backgroundColor = color;
              parent.style.borderColor = 'transparent';
              e.currentTarget.remove();
              const span = document.createElement('span');
              span.className = 'text-white font-bold text-xs';
              span.textContent = initials;
              parent.appendChild(span);
            }
          }}
        />
      </div>
    );
  }

  // Fallback: initials badge (no logoPath or logoPath not yet available)
  return (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center font-bold text-white shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-label={`${initials} logo`}
    >
      {initials}
    </div>
  );
}
