import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    isLoading,
    disabled,
    ...props
}) => {
    return (
        <button
            className={clsx(styles.button, styles[variant], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <span className={styles.spinner} />}
            {children}
        </button>
    );
};
