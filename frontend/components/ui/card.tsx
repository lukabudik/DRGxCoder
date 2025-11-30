import { HTMLAttributes, ReactNode } from 'react';
import styles from './card.module.css';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'lg', ...props }: CardProps) {
  return (
    <div
      className={clsx(styles.card, styles[`padding-${padding}`], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: Omit<CardProps, 'padding'>) {
  return (
    <div className={clsx(styles.cardHeader, className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: Omit<CardProps, 'padding'>) {
  return (
    <h3 className={clsx(styles.cardTitle, className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }: Omit<CardProps, 'padding'>) {
  return (
    <div className={clsx(styles.cardContent, className)} {...props}>
      {children}
    </div>
  );
}
