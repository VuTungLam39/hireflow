/** Nguồn trích dẫn BE gửi trong sự kiện `sources` của stream */
export interface ChatSource {
  candidateId: string
  chunkId: string
  candidateName: string
  applicationId: string
  /** Đoạn CV được trích */
  excerpt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources: ChatSource[]
  status: 'streaming' | 'done' | 'error'
}
