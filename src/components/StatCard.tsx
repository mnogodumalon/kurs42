import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hero?: boolean;
}

export function StatCard({ label, value, icon, hero }: StatCardProps) {
  if (hero) {
    return (
      <div className="stat-card-hero">
        <div className="flex items-center justify-between">
          <div>
            <p className="stat-label-light">{label}</p>
            <p className="stat-value mt-1">{value}</p>
          </div>
          {icon && <div className="opacity-80">{icon}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1 text-foreground">{value}</p>
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
    </div>
  );
}
