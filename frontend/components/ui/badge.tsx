import { HTMLAttributes, ReactNode } from 'react';
import styles from './badge.module.css';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={clsx(styles.badge, styles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
