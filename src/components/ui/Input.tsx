import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('input', error && 'input-error', className)}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('textarea', error && 'input-error', className)}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, error, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('select', error && 'input-error', className)}
      {...props}
    />
  )
)
Select.displayName = 'Select'

export const Label = ({ className, children, ...props }: { className?: string; children: React.ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('label', className)} {...props}>{children}</label>
)