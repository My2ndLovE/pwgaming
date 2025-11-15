'use client';

interface SkeletonProps {
  variant?: 'rectangular' | 'circle';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const variantClasses = {
    rectangular: 'rounded',
    circle: 'rounded-full',
  };

  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div
      className={classes}
      style={{
        width,
        height,
      }}
    />
  );
}
