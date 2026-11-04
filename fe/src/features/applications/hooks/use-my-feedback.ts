import { useMemo, useState } from 'react'
import { useInterviews, useNow } from '@/features/interviews'
import { useAuthStore } from '@/stores/auth.store'

export type MyFeedback =
  { kind: 'due'; at: string } | { kind: 'upcoming'; at: string } | { kind: 'sent' }

const YEAR_MS = 365 * 86_400_000

// BR-INT-03
export function useMyFeedback(enabled: boolean) {
  const userId = useAuthStore((s) => s.user?.id)
  const [from] = useState(() => new Date(Date.now() - YEAR_MS).toISOString())
  const query = useInterviews({ from, mine: true }, { enabled })
  const now = useNow()

  return useMemo(() => {
    const byApplication = new Map<string, MyFeedback>()
    if (!query.data || !userId) return byApplication
    const mine = query.data
      .filter((iv) => iv.status !== 'CANCELLED')
      .map((iv) => ({ iv, me: iv.interviewers.find((p) => p.id === userId) }))
      .filter((x) => x.me)
      .sort((a, b) => a.iv.scheduledAt.localeCompare(b.iv.scheduledAt))

    for (const { iv, me } of mine) {
      const current = byApplication.get(iv.applicationId)
      const past = new Date(iv.scheduledAt).getTime() <= now
      const next: MyFeedback =
        past && !me!.submitted
          ? { kind: 'due', at: iv.scheduledAt }
          : !past
            ? { kind: 'upcoming', at: iv.scheduledAt }
            : { kind: 'sent' }
      if (!current || rank(next) < rank(current)) byApplication.set(iv.applicationId, next)
    }
    return byApplication
  }, [query.data, userId, now])
}

const rank = (f: MyFeedback) => (f.kind === 'due' ? 0 : f.kind === 'upcoming' ? 1 : 2)
