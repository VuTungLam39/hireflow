import { create } from 'zustand'

type Weights = Record<string, number>

interface RankingDraftState {
  /** jobId → (requirementId → trọng số nháp) */
  drafts: Record<string, Weights>
  setWeight: (jobId: string, requirementId: string, weight: number) => void
  reset: (jobId: string) => void
}

/**
 * Trọng số nháp của bảng xếp hạng (FE Architecture mục 9.1). Đặt trong Zustand vì
 * thanh trọng số và bảng là hai nhánh component khác nhau. Luôn đọc bằng selector.
 */
export const useRankingDraft = create<RankingDraftState>()((set) => ({
  drafts: {},
  setWeight: (jobId, requirementId, weight) =>
    set((state) => ({
      drafts: { ...state.drafts, [jobId]: { ...state.drafts[jobId], [requirementId]: weight } },
    })),
  reset: (jobId) =>
    set((state) => {
      const { [jobId]: _removed, ...rest } = state.drafts
      return { drafts: rest }
    }),
}))

const EMPTY: Weights = {}

/** Selector trả về object ổn định khi job chưa có nháp (tránh render thừa) */
export const useJobDraft = (jobId: string) => useRankingDraft((s) => s.drafts[jobId] ?? EMPTY)
