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
        'cool-card',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm font-medium text-zinc-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
