import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Send,
  Bot,
  User,
  BookOpen,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Search,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Keyboard,
} from 'lucide-react'
import './RagChatDrawer.css'

// ── Types ───────────────────────────────────────────────────────────────────

export interface Citation {
  id: string
  title: string
  source: string
  pageRef?: string
  url?: string
  confidence: number   // 0-100
  excerpt: string
  type: 'report' | 'database' | 'news' | 'analysis' | 'classified'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: Date
  isStreaming?: boolean
}

interface RagChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<string, { content: string; citations: Citation[] }> = {
  default: {
    content: `Based on a synthesis of **47 intelligence sources** across open and closed datasets, here is a structured assessment:

**Key Findings:**
- Primary threat vectors remain concentrated in Southeast Asia corridor with a **73% confidence** rating from SIGINT feeds
- Economic indicators suggest a 18-month runway before critical threshold is reached  
- Three conflicting narratives identified in HUMINT reports — recommend adversarial debrief protocol

**Analytical Note:** The low-confidence cluster (sources #12, #31, #44) shows temporal drift of ~14 days, which may indicate deliberate disinformation seeding. Recommend flagging for counterintelligence review.`,
    citations: [
      {
        id: 'c1',
        title: 'Southeast Asia Threat Landscape Q3 2026',
        source: 'DIA Strategic Assessment',
        pageRef: 'pp. 14–18',
        confidence: 91,
        excerpt: 'Primary threat vectors remain concentrated along the Strait corridor with elevated SIGINT activity observed between March–August 2026.',
        type: 'classified',
      },
      {
        id: 'c2',
        title: 'Economic Stability Index — Emerging Markets',
        source: 'World Economic Forum Database',
        pageRef: 'Table 4.2',
        url: 'https://weforum.org',
        confidence: 84,
        excerpt: 'GDP contraction of 2.3% projected for FY2027 under current monetary policy constraints.',
        type: 'database',
      },
      {
        id: 'c3',
        title: 'HUMINT Reconciliation Report — Operation Sandstorm',
        source: 'Internal Analyst Brief',
        pageRef: 'Section 3.1',
        confidence: 67,
        excerpt: 'Three conflicting source accounts cannot be reconciled without additional corroboration. Temporal inconsistencies noted.',
        type: 'analysis',
      },
      {
        id: 'c4',
        title: 'Regional Power Dynamics Shift 2026',
        source: 'Reuters Intelligence Wire',
        url: 'https://reuters.com',
        confidence: 78,
        excerpt: 'Diplomatic realignment observed across 6 nation-states following summit failure in June 2026.',
        type: 'news',
      },
    ],
  },
  risk: {
    content: `**Risk Matrix Analysis — Current Operational Period**

After cross-referencing **31 data points** across 5 risk categories:

1. **CRITICAL** — Supply chain compromise probability: **84%** (within 90 days)
2. **HIGH** — Cyber intrusion attempts up 340% YoY on critical infrastructure  
3. **MEDIUM** — Political instability index in Region Alpha at 6.2/10

The confluence of supply chain and cyber risk creates a **compounding threat scenario** not previously modeled in baseline assessments. Immediate escalation to Tier-1 review recommended.`,
    citations: [
      {
        id: 'r1',
        title: 'Critical Infrastructure Vulnerability Assessment',
        source: 'CISA Technical Report TR-2026-09',
        pageRef: 'Executive Summary',
        confidence: 95,
        excerpt: 'Supply chain vectors identified in 12 of 15 sampled critical infrastructure nodes.',
        type: 'report',
      },
      {
        id: 'r2',
        title: 'Cyber Threat Intelligence Bulletin — Q3',
        source: 'NSA/CSS Quarterly Brief',
        pageRef: 'p. 7',
        confidence: 88,
        excerpt: 'State-sponsored actor attribution confirmed in 73% of critical infrastructure incidents.',
        type: 'classified',
      },
      {
        id: 'r3',
        title: 'Political Risk Index — Global Regions',
        source: 'Oxford Analytica Database',
        url: 'https://oxan.com',
        confidence: 72,
        excerpt: 'Region Alpha composite score: 6.2/10 — threshold for elevated monitoring is 6.0.',
        type: 'database',
      },
    ],
  },
}

function getMockResponse(query: string) {
  const q = query.toLowerCase()
  if (q.includes('risk') || q.includes('threat') || q.includes('danger')) {
    return MOCK_RESPONSES.risk
  }
  return MOCK_RESPONSES.default
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <Bot size={14} />
      </div>
      <div className="typing-dots">
        <span className="dot" style={{ animationDelay: '0ms' }} />
        <span className="dot" style={{ animationDelay: '150ms' }} />
        <span className="dot" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="typing-label">Querying intelligence sources…</span>
    </div>
  )
}

function CitationBadge({ citation, index }: { citation: Citation; index: number }) {
  const [expanded, setExpanded] = useState(false)

  const typeColors: Record<Citation['type'], string> = {
    classified: 'citation-type--classified',
    report:     'citation-type--report',
    database:   'citation-type--database',
    news:       'citation-type--news',
    analysis:   'citation-type--analysis',
  }

  const typeLabels: Record<Citation['type'], string> = {
    classified: '🔒 Classified',
    report:     '📄 Report',
    database:   '🗃️ Database',
    news:       '📡 News Wire',
    analysis:   '🔍 Analysis',
  }

  const confidenceColor =
    citation.confidence >= 85 ? 'conf--high' :
    citation.confidence >= 65 ? 'conf--med'  : 'conf--low'

  return (
    <div className={`citation-badge ${expanded ? 'expanded' : ''}`}>
      <button
        className="citation-header"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Citation ${index + 1}: ${citation.title}`}
      >
        <span className="citation-index">[{index + 1}]</span>
        <BookOpen size={11} className="citation-book-icon" />
        <span className="citation-title">{citation.title}</span>
        <span className={`citation-type-label ${typeColors[citation.type]}`}>
          {typeLabels[citation.type]}
        </span>
        <span className={`citation-confidence ${confidenceColor}`}>
          {citation.confidence}%
        </span>
        <ChevronDown size={12} className={`citation-chevron ${expanded ? 'rotated' : ''}`} />
      </button>

      {expanded && (
        <div className="citation-body">
          <div className="citation-meta">
            <span className="meta-source">{citation.source}</span>
            {citation.pageRef && (
              <span className="meta-page">{citation.pageRef}</span>
            )}
          </div>
          <blockquote className="citation-excerpt">
            "{citation.excerpt}"
          </blockquote>
          <div className="citation-actions">
            <div className={`confidence-bar-track`}>
              <div
                className={`confidence-bar-fill ${confidenceColor}`}
                style={{ width: `${citation.confidence}%` }}
              />
            </div>
            <span className="confidence-label">Confidence: {citation.confidence}%</span>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="citation-link"
                aria-label={`Open source: ${citation.title}`}
              >
                <ExternalLink size={11} />
                Open Source
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Bold **text**
        const boldified = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
          return <p key={i} className="msg-heading" dangerouslySetInnerHTML={{ __html: boldified }} />
        }
        if (line.match(/^\d+\.\s/)) {
          return <p key={i} className="msg-list-item" dangerouslySetInnerHTML={{ __html: boldified }} />
        }
        if (line.startsWith('- ')) {
          return <p key={i} className="msg-list-bullet" dangerouslySetInnerHTML={{ __html: boldified }} />
        }
        if (line === '') return <br key={i} />
        return <p key={i} className="msg-para" dangerouslySetInnerHTML={{ __html: boldified }} />
      })
  }

  return (
    <div className={`message-row ${isAssistant ? 'row-assistant' : 'row-user'}`} id={`msg-${message.id}`}>
      {isAssistant && (
        <div className="msg-avatar assistant-avatar" aria-label="AI Assistant">
          <Bot size={14} />
        </div>
      )}

      <div className={`message-bubble ${isAssistant ? 'bubble-assistant' : 'bubble-user'}`}>
        {message.isStreaming ? (
          <div className="streaming-content">
            <span className="streaming-cursor">{message.content}</span>
          </div>
        ) : (
          <div className="msg-content">{renderContent(message.content)}</div>
        )}

        {/* Citations */}
        {isAssistant && message.citations && message.citations.length > 0 && !message.isStreaming && (
          <div className="citations-section">
            <div className="citations-header">
              <Search size={11} />
              <span>{message.citations.length} Intelligence Sources</span>
            </div>
            <div className="citations-list">
              {message.citations.map((cit, i) => (
                <CitationBadge key={cit.id} citation={cit} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Message actions */}
        {isAssistant && !message.isStreaming && (
          <div className="msg-actions">
            <button
              className="msg-action-btn"
              onClick={handleCopy}
              aria-label="Copy response"
              title="Copy"
            >
              <Copy size={12} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="msg-action-btn" aria-label="Helpful" title="Mark helpful">
              <ThumbsUp size={12} />
            </button>
            <button className="msg-action-btn" aria-label="Not helpful" title="Mark unhelpful">
              <ThumbsDown size={12} />
            </button>
          </div>
        )}

        <span className="msg-timestamp">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {!isAssistant && (
        <div className="msg-avatar user-avatar-icon" aria-label="You">
          <User size={14} />
        </div>
      )}
    </div>
  )
}

// ── Suggested Prompts ─────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'Summarize the current threat landscape',
  'Analyze risk matrix for next quarter',
  'Identify conflicting intelligence sources',
  'What are the highest-confidence findings?',
]

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * RagChatDrawer
 *
 * A slide-over AI chat panel with Retrieval-Augmented Generation (RAG) citations.
 * Features:
 *  - Right-edge slide-in / slide-out animation
 *  - Chat bubbles for user and AI messages
 *  - Expandable citation chips with confidence scores, source refs, and excerpts
 *  - Streaming-style typing indicator
 *  - Ctrl+K keyboard shortcut to toggle
 *  - Suggested prompt chips
 */
export default function RagChatDrawer({ isOpen, onClose }: RagChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello. I\'m your Executive Intelligence Copilot powered by RAG over your classified and open-source document corpus.\n\nAsk me anything — I\'ll provide sourced, cited responses with confidence ratings for every claim.',
      citations: [],
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Ctrl+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = useCallback(async (text?: string) => {
    const query = (text ?? input).trim()
    if (!query || isTyping) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate network delay + streaming
    await new Promise(r => setTimeout(r, 1200))
    setIsTyping(false)

    const { content, citations } = getMockResponse(query)
    const assistantId = `a-${Date.now()}`

    // Stream in the response character by character
    const streamingMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, streamingMsg])
    setStreamingId(assistantId)

    // Simulate streaming text
    for (let i = 0; i <= content.length; i += 6) {
      await new Promise(r => setTimeout(r, 20))
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: content.slice(0, i) }
            : m
        )
      )
    }

    // Finalise with full content + citations
    setMessages(prev =>
      prev.map(m =>
        m.id === assistantId
          ? { ...m, content, citations, isStreaming: false }
          : m
      )
    )
    setStreamingId(null)
  }, [input, isTyping])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([{
      id: 'welcome-reset',
      role: 'assistant',
      content: 'Chat cleared. How can I assist with your intelligence analysis?',
      citations: [],
      timestamp: new Date(),
    }])
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`rag-drawer ${isOpen ? 'drawer-open' : 'drawer-closed'}`}
        role="complementary"
        aria-label="AI Intelligence Copilot"
        aria-hidden={!isOpen}
        id="rag-chat-drawer"
      >
        {/* Header */}
        <header className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-ai-icon">
              <Sparkles size={16} />
            </div>
            <div className="drawer-title-group">
              <h2 className="drawer-title">Intelligence Copilot</h2>
              <div className="drawer-status">
                <span className="status-dot" />
                <span>RAG · {messages.length - 1} queries</span>
              </div>
            </div>
          </div>
          <div className="drawer-header-actions">
            <button
              className="btn-icon"
              onClick={handleClearChat}
              title="Clear chat"
              aria-label="Clear chat history"
              id="clear-chat-btn"
            >
              <RotateCcw size={15} />
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              title="Close (Ctrl+K)"
              aria-label="Close drawer"
              id="close-drawer-btn"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Shortcut hint */}
        <div className="shortcut-hint">
          <Keyboard size={11} />
          <span>Press <kbd>Ctrl+K</kbd> to toggle · <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for newline</span>
        </div>

        {/* Messages */}
        <div className="drawer-messages" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts — only show if no user messages yet */}
        {messages.filter(m => m.role === 'user').length === 0 && !isTyping && (
          <div className="suggested-prompts" role="group" aria-label="Suggested queries">
            <p className="suggested-label">Suggested queries</p>
            <div className="prompts-grid">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  className="prompt-chip"
                  onClick={() => sendMessage(p)}
                  aria-label={`Ask: ${p}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="drawer-input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the intelligence copilot…"
              rows={1}
              disabled={isTyping || !!streamingId}
              aria-label="Chat message input"
              id="chat-input"
            />
            <button
              className={`send-btn ${input.trim() && !isTyping ? 'send-btn--active' : ''}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping || !!streamingId}
              aria-label="Send message"
              id="send-message-btn"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="input-footer">
            Responses are AI-generated. Always verify with primary sources.
          </p>
        </div>
      </aside>
    </>
  )
}
