import { useState } from 'react'
import { MessageSquareQuote } from 'lucide-react'
import RagChatDrawer from '../components/copilot/RagChatDrawer'

export default function CopilotPage() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <div className="page-content">
        <div className="page-header animate-fade-in-up" style={{ marginBottom: 28 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.625rem' }}>AI Intelligence Copilot</h1>
            <p className="page-subtitle">RAG-powered assistant across your full intelligence corpus</p>
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)} id="open-full-copilot-btn">
            <MessageSquareQuote size={15} /> Open Chat
          </button>
        </div>
        <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <MessageSquareQuote size={40} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: 10 }}>Intelligence Copilot</h3>
          <p style={{ maxWidth: 420, margin: '0 auto 24px', fontSize: '0.875rem' }}>
            Ask questions across 47 intelligence sources. Every response includes expandable citations, source references, and confidence scores.
          </p>
          <button className="btn-primary" onClick={() => setOpen(true)} id="start-chat-btn">
            <MessageSquareQuote size={15} /> Start Querying
          </button>
        </div>
      </div>
      <RagChatDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
