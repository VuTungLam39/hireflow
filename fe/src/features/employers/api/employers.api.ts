import { api } from '@/lib/api-client'
import type { RegisterEmployerInput } from '../schemas/register.schema'

// KH MVP 3 mục 8.1 · US-19, BR-ACC-09
export const employersApi = {
  register: async (input: RegisterEmployerInput) => {
    await api.post('/public/employers/register', input)
  },

  verifyEmail: async (token: string) => {
    await api.post('/public/employers/verify-email', { token })
  },

  resendVerification: async (email: string) => {
    await api.post('/public/employers/resend-verification', { email })
  },
}
