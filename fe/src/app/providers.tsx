import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-left"
        duration={5000}
        gap={8}
        offset={{ bottom: 20, left: 20 }}
        mobileOffset={{ bottom: 16, left: 16, right: 16 }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'bg-ink text-white shadow-float flex w-full items-center gap-3 rounded-sm px-4 py-3 text-sm sm:w-[380px]',
            title: 'font-normal leading-5',
            description: 'text-white/70 text-[13px]',
            actionButton:
              'text-marker ml-auto shrink-0 font-semibold hover:underline underline-offset-2',
            cancelButton: 'text-white/70 ml-auto shrink-0',
            error: 'bg-ink [&_[data-icon]]:text-bad-soft',
            success: 'bg-ink [&_[data-icon]]:text-marker',
            icon: 'shrink-0 [&_svg]:size-4',
          },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-right" />}
    </QueryClientProvider>
  )
}
