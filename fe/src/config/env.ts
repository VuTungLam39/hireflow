import { z } from 'zod'

// Kiểm tra biến môi trường ngay khi app khởi động
const envSchema = z.object({
  VITE_API_URL: z.string().min(1).default('/api/v1'),
})

const parsed = envSchema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${z.prettifyError(parsed.error)}`)
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL,
  isDev: import.meta.env.DEV,
} as const
