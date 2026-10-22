import { changePasswordSchema, loginSchema, passwordSchema } from './auth.schema'

describe('auth schemas', () => {
  it('normalizes email on login', () => {
    const result = loginSchema.parse({ email: '  Admin@Example.com ', password: 'x' })
    expect(result.email).toBe('admin@example.com')
  })

  it.each(['password', 'PASSWORD1', 'Pass1', `Aa1${'x'.repeat(70)}`])(
    'rejects weak or too long password %s (BR-ACC-06)',
    (value) => {
      expect(passwordSchema.safeParse(value).success).toBe(false)
    },
  )

  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Password123').success).toBe(true)
  })

  describe('changePasswordSchema', () => {
    const valid = {
      currentPassword: 'Password123',
      newPassword: 'NewPass123',
      confirmPassword: 'NewPass123',
    }

    it('accepts a valid change', () => {
      expect(changePasswordSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects reusing the current password', () => {
      const result = changePasswordSchema.safeParse({
        ...valid,
        newPassword: valid.currentPassword,
        confirmPassword: valid.currentPassword,
      })
      expect(result.error?.issues[0].path).toEqual(['newPassword'])
    })

    it('rejects mismatched confirm password', () => {
      const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'NewPass124' })
      expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
    })
  })
})
