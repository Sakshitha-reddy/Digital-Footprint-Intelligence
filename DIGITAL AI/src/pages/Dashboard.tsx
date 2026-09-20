import { useState, useCallback } from 'react'
import {
  Shield, AlertTriangle, TrendingUp, Globe,
  MessageSquareQuote, FileText, Activity,
  Zap, Eye, BarChart2, Clock,
} from 'lucide-react'
import RagChatDrawer from '../components/copilot/RagChatDrawer'
import DossierModal from '../components/export/DossierModal'
import './Dashboard.css'

// ── Stat card data ─────────────────────────────────────────────────
const STATS = [
  { id: 'threat-level',   label: 'Threat Level',     value: 'HIGH',  sub: '+2 from last week',   icon: Shield,      color: 'var(--accent-rose)',    badge: 'badge-rose' },
  { id: 'active-sources', label: 'Active Sources',    value: '47',    sub: '12 classified',        icon: Globe,       color: 'var(--accent-primary)', badge: 'badge-blue' },
  { id: 'findings',       label: 'Key Findings',      value: '6',     sub: '2 require action',     icon: TrendingUp,  color: 'var(--accent-amber)',   badge: 'badge-amber' },
  { id: 'confidence',     label: 'Avg Confidence',    value: '84%',   sub: 'Cross-source mean',    icon: Activity,    color: 'var(--accent-emerald)', badge: 'badge-emerald' },
]

const RECENT_ALERTS = [
  { id: 1, time: '09:14', title: 'APT Infrastructure Alert', severity: 'CRITICAL', detail: 'Persistent access confirmed in 12/15 SCADA nodes.' },
  { id: 2, time: '08:52', title: 'Supply Chain Threshold Breach', severity: 'HIGH', detail: 'Rare earth vulnerability index exceeded red-line.' },
  { id: 3, time: '07:30', title: 'HUMINT Conflict Detected', severity: 'ELEVATED', detail: 'Adversarial Debrief Protocol ADP-2026-047 activated.' },
  { id: 4, time: '06:15', title: 'Allied Sharing Declined', severity: 'HIGH', detail: 'Region Alpha / Delta coverage gap confirmed.' },
]

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: 'badge-rose',
  HIGH:     'badge-amber',
  ELEVATED: 'badge-blue',
  LOW:      'badge-emerald',
}

export default function Dashboard() {
  const [chatOpen, setChatOpen]       = useState(false)
  const [dossierOpen, setDossierOpen] = useState(false)

  const openChat    = useCallback(() => setChatOpen(true),    [])
  const closeChat   = useCallback(() => setChatOpen(false),   [])
  const openDossier = useCallback(() => setDossierOpen(true), [])
  const closeDossier= useCallback(() => setDossierOpen(false),[])

  return (
    <>
      <div className="page-content dashboard-page">

        {/* ── Page Header ── */}
        <div className="page-header animate-fade-in-up">
          <div className="page-header-left">
            <span className="page-eyebrow">
              <Clock size={13} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <h1 className="page-title">Intelligence Dashboard</h1>
            <p className="page-subtitle">
              Real-time executive intelligence across 47 sources · Q3 2026 operational period
            </p>
          </div>
          <div className="page-header-actions">
            <button
              className="btn-ghost"
              onClick={openDossier}
              id="open-dossier-btn"
              aria-label="Open executive dossier report"
            >
              <FileText size={15} />
              Export Dossier
            </button>
            <button
              className="btn-primary"
              onClick={openChat}
              id="open-copilot-btn"
              aria-label="Open AI copilot chat"
            >
              <MessageSquareQuote size={15} />
              Open Copilot
              <kbd className="shortcut-kbd">⌘K</kbd>
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="stats-grid">
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.id}
                className="stat-card animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
                id={`stat-${stat.id}`}
              >
                <div className="stat-header">
                  <span className="stat-label">{stat.label}</span>
                  <div className="stat-icon" style={{ color: stat.color }}>
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-sub">{stat.sub}</div>
              </div>
            )
          })}
        </div>

        {/* ── Main Grid ── */}
        <div className="dashboard-grid">

          {/* Recent Alerts */}
          <div className="card dashboard-alerts animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
              <div className="card-title-row">
                <AlertTriangle size={16} className="card-icon-warn" />
                <h2 className="card-title">Recent Alerts</h2>
              </div>
              <span className="badge badge-rose">{RECENT_ALERTS.length} Active</span>
            </div>
            <div className="alerts-list">
              {RECENT_ALERTS.map(alert => (
                <div key={alert.id} className="alert-item" id={`alert-${alert.id}`}>
                  <div className="alert-time">{alert.time}</div>
                  <div className="alert-content">
                    <div className="alert-top">
                      <span className="alert-title">{alert.title}</span>
                      <span className={`badge ${SEVERITY_CLASS[alert.severity] || 'badge-gray'}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="alert-detail">{alert.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copilot CTA */}
          <div
            className="card copilot-cta animate-fade-in-up"
            style={{ animationDelay: '280ms' }}
          >
            <div className="cta-glow" />
            <div className="cta-icon">
              <Zap size={28} />
            </div>
            <h3 className="cta-title">AI Intelligence Copilot</h3>
            <p className="cta-desc">
              Ask anything across your intelligence corpus. Every response is grounded in
              real sources with confidence scores and citations.
            </p>
            <div className="cta-features">
              <div className="cta-feature"><Eye size={13} /> RAG over 47 sources</div>
              <div className="cta-feature"><BarChart2 size={13} /> Confidence-rated</div>
              <div className="cta-feature"><Shield size={13} /> Classification-aware</div>
            </div>
            <button
              className="btn-primary cta-btn"
              onClick={openChat}
              id="cta-open-copilot-btn"
              aria-label="Open AI copilot"
            >
              <MessageSquareQuote size={16} />
              Start Querying
            </button>
            <p className="cta-hint">Press <kbd>Ctrl+K</kbd> anywhere to toggle</p>
          </div>

          {/* Dossier CTA */}
          <div
            className="card dossier-cta animate-fade-in-up"
            style={{ animationDelay: '340ms' }}
          >
            <div className="dossier-cta-header">
              <FileText size={20} className="dossier-cta-icon" />
              <div>
                <h3 className="cta-title">Executive Dossier</h3>
                <p className="dossier-meta">Q3 2026 · TOP SECRET // NOFORN</p>
              </div>
            </div>
            <div className="divider" />
            <div className="dossier-sections">
              {['Executive Summary', 'Key Findings (6)', 'Risk Matrix (5 items)', 'Intelligence Sources (5)', 'Recommendations (6)'].map(s => (
                <div key={s} className="dossier-section-row">
                  <span className="section-dot" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary dossier-open-btn"
              onClick={openDossier}
              id="cta-open-dossier-btn"
              aria-label="Open executive dossier"
            >
              <FileText size={15} />
              View Full Report
            </button>
          </div>
        </div>
      </div>

      {/* ── Drawer & Modal ── */}
      <RagChatDrawer isOpen={chatOpen} onClose={closeChat} />
      <DossierModal  isOpen={dossierOpen} onClose={closeDossier} />
    </>
  )
}
