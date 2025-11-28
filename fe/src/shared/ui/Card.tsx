import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    className,
    padding = 'md',
    ...props
}) => {
    return (
        <div className={clsx(styles.card, styles[`padding-${padding}`], className)} {...props}>
            {children}
        </div>
    );
};
