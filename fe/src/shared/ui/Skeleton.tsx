import React from 'react';
import clsx from 'clsx';
import styles from './Skeleton.module.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number;
    height?: string | number;
    circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    width,
    height,
    circle,
    style,
    ...props
}) => {
    return (
        <div
            className={clsx(styles.skeleton, circle && styles.circle, className)}
            style={{ width, height, ...style }}
            {...props}
        />
    );
};
