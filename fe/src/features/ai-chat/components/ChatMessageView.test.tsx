import { render, screen } from '@testing-library/react'
import type { ChatMessage, ChatSource } from '../types'
import { ChatMessageView } from './ChatMessageView'

const source = (id: string, name: string): ChatSource => ({
  candidateId: id,
  chunkId: 'k1',
  candidateName: name,
  applicationId: `app-${id}`,
  excerpt: `Đoạn CV của ${name}`,
})
const sources = [source('c1', 'An'), source('c2', 'Bình'), source('c3', 'Chi')]
const answer = (content: string): ChatMessage => ({
  id: 'm1',
  role: 'assistant',
  content,
  sources,
  status: 'done',
})

// US-08
describe('ChatMessageView', () => {
  it('lists only the sources the answer cites, keeping their numbers', () => {
    render(<ChatMessageView message={answer('Bình biết Kafka [c2#k1].')} onCite={() => {}} />)
    expect(screen.getByText('Nguồn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nguồn 2: Bình' })).toBeInTheDocument()
    expect(screen.getByText('Bình')).toBeInTheDocument()
    expect(screen.queryByText('An')).not.toBeInTheDocument()
    expect(screen.queryByText('Chi')).not.toBeInTheDocument()
  })

  it('shows no source list when the answer has no citation, such as "not enough information"', () => {
    render(
      <ChatMessageView
        message={answer('Không đủ thông tin trong kho CV để trả lời câu hỏi này.')}
        onCite={() => {}}
      />,
    )
    expect(screen.queryByText('Nguồn')).not.toBeInTheDocument()
  })
})
