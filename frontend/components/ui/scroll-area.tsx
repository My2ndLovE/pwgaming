import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`overflow-auto ${className}`}>
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
