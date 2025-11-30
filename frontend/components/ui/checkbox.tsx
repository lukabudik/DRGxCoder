"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { clsx } from "clsx"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const isChecked = checked === true || checked === 'indeterminate';
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={clsx(
        "peer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        width: '16px',
        height: '16px',
        border: isChecked ? 'none' : `1.5px solid ${isHovered ? '#94a3b8' : '#cbd5e1'}`,
        backgroundColor: isChecked ? 'var(--color-primary)' : (isHovered ? '#f8fafc' : 'white'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        borderRadius: 'var(--radius-sm)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={clsx("flex items-center justify-center text-current")}
      >
        <Check style={{ width: '12px', height: '12px', color: 'white' }} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
