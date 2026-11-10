export const TONE_DOT = {
  neutral: 'bg-ink-faint',
  info: 'bg-info',
  success: 'bg-good',
  warning: 'bg-warn',
  danger: 'bg-bad',
} as const

export type BadgeTone = keyof typeof TONE_DOT
