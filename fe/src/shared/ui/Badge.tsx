import React from 'react';
import clsx from 'clsx';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'info' | 'neutral' | 'error';
    size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    className,
    variant = 'neutral',
    size = 'md',
    ...props
}) => {
    return (
        <span
            className={clsx(styles.badge, styles[variant], styles[size], className)}
            {...props}
        >
            {children}
        </span>
    );
};
