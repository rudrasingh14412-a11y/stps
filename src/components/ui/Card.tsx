import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
  key?: React.Key;
}

export const Card = ({ className, title, subtitle, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>}
          {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
