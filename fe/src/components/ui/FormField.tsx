import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

/** Label + ô nhập + thông báo lỗi */
export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
