/**
 * Công thức điểm – hàm thuần, giống hệt BE (kickoff mục 8.4, Backend Architecture mục 12.2):
 *   Điểm = 100 × Σ(w(i) × m(i)) / Σ w(i), làm tròn số nguyên.
 * m(i): 1 = khớp, 0.5 = có kỹ năng nhưng thiếu số năm, 0 = không có.
 * FE dùng để xếp hạng lại tức thì khi kéo trọng số, không gọi LLM.
 */
export interface WeightedMatch {
  weight: number
  match: number
}

export function computeScore(items: WeightedMatch[]): number {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  if (totalWeight === 0) return 0
  const gained = items.reduce((sum, i) => sum + i.weight * i.match, 0)
  return Math.round((100 * gained) / totalWeight)
}

export interface RankInput {
  id: string
  name: string
  /** requirementId → mức khớp */
  matches: Record<string, number>
}

export interface Ranked<T> {
  item: T
  score: number
  rank: number
}

/** Tính điểm theo bộ trọng số rồi xếp hạng: điểm giảm dần, bằng điểm thì theo tên */
export function rankByWeights<T extends RankInput>(
  items: T[],
  weights: Record<string, number>,
): Ranked<T>[] {
  const requirementIds = Object.keys(weights)
  return items
    .map((item) => ({
      item,
      score: computeScore(
        requirementIds.map((id) => ({ weight: weights[id], match: item.matches[id] ?? 0 })),
      ),
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'vi'))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}
