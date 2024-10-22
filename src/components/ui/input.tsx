import { forwardRef, InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactElement;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className, type, ...props }, ref) => {
    return (
      <div className="w-full relative">
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
            className,
            { 'pl-8': icon },
          )}
          ref={ref}
          {...props}
        />

        {icon && (
          <div className="select-none pointer-events-none absolute flex items-center justify-center top-0 bottom-0 left-3 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
