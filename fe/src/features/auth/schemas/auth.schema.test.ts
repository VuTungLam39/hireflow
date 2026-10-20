import { loginSchema, registerSchema } from './auth.schema'

describe('auth schemas', () => {
  it('normalizes email on login', () => {
    const result = loginSchema.parse({ email: '  Admin@Example.com ', password: 'x' })
    expect(result.email).toBe('admin@example.com')
  })

  it('rejects weak passwords', () => {
    const result = registerSchema.safeParse({
      fullName: 'Intern',
      email: 'a@b.com',
      password: 'password',
      confirmPassword: 'password',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched confirm password', () => {
    const result = registerSchema.safeParse({
      fullName: 'Intern',
      email: 'a@b.com',
      password: 'Password123',
      confirmPassword: 'Password124',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })
})
