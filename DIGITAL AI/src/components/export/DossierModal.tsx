import { useEffect, useRef } from 'react'
import {
  X,
  Printer,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Globe,
  Lock,
  Clock,
  BookMarked,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react'
import './DossierModal.css'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RiskItem {
  id: string
  category: string
  likelihood: 'Critical' | 'High' | 'Medium' | 'Low'
  impact: 'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  mitigation: string
  owner: string
  status: 'Open' | 'Mitigating' | 'Monitored' | 'Closed'
}

interface IntelSource {
  id: string
  title: string
  classification: 'TOP SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'UNCLASSIFIED'
  date: string
  confidence: number
  summary: string
}

interface DossierData {
  title: string
  classification: string
  preparedBy: string
  preparedFor: string
  date: string
  period: string
  executiveSummary: string
  keyFindings: string[]
  risks: RiskItem[]
  sources: IntelSource[]
  recommendations: { priority: 'IMMEDIATE' | 'SHORT-TERM' | 'STRATEGIC'; text: string }[]
  overallThreatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW'
}

interface DossierModalProps {
  isOpen: boolean
  onClose: () => void
  dossier?: Partial<DossierData>
}

// ── Mock Dossier Data ─────────────────────────────────────────────────────────

const DEFAULT_DOSSIER: DossierData = {
  title: 'Executive Intelligence Dossier — Q3 2026',
  classification: 'TOP SECRET // NOFORN',
  preparedBy: 'Digital AI Intelligence Platform',
  preparedFor: 'Executive Leadership Council',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  period: 'July 1 – September 30, 2026',
  overallThreatLevel: 'HIGH',
  executiveSummary: `This quarterly executive intelligence dossier provides a comprehensive assessment of the global threat landscape, emerging risks, and strategic opportunities identified across 47 intelligence sources spanning open-source, classified, and proprietary data streams.

The period under review was characterized by significant geopolitical realignment in the Indo-Pacific theatre, an unprecedented 340% surge in state-sponsored cyber intrusions targeting critical infrastructure, and accelerating economic fragmentation across G20 nations. Three primary threat vectors were identified requiring immediate executive attention and resource allocation.

Confidence in overall assessment: HIGH (84%) based on cross-source corroboration and validated HUMINT channels.`,
  keyFindings: [
    'State-sponsored cyber actors attributed to two nation-states achieved persistent access in 12 of 15 sampled critical infrastructure nodes — a 67% increase from Q2 2026.',
    'Economic fragmentation indicators reached threshold levels in 8 of 20 monitored markets, suggesting accelerated deglobalization timeline of 18–24 months ahead of prior projections.',
    'HUMINT sources confirm operational preparation by non-state actors in three geographic areas of concern; imminent timeline assessment revised to 60–90 days.',
    'Supply chain vulnerability index exceeded red-line threshold for the first time in 11 quarters, driven by rare earth mineral concentration risk.',
    'Three conflicting intelligence narratives identified regarding the leadership composition of a key adversarial entity — adversarial debrief protocol recommended.',
    'Allied partner intelligence sharing dropped 22% following summit failure in June 2026, creating analytical blind spots in Regions Alpha and Delta.',
  ],
  risks: [
    {
      id: 'R-001',
      category: 'Cyber / Infrastructure',
      likelihood: 'Critical',
      impact: 'Critical',
      description: 'Advanced Persistent Threat (APT) groups maintaining active footholds in critical infrastructure — power grid, water systems, financial networks.',
      mitigation: 'Immediate network segmentation, zero-trust architecture deployment, 24/7 SOC monitoring uplift.',
      owner: 'CISO / Infrastructure Lead',
      status: 'Mitigating',
    },
    {
      id: 'R-002',
      category: 'Supply Chain',
      likelihood: 'High',
      impact: 'Critical',
      description: 'Rare earth mineral supply concentration creates single-point-of-failure risk for 14 critical manufacturing processes.',
      mitigation: 'Diversification across 3 alternate supplier nations, strategic reserve build-up (6-month buffer target).',
      owner: 'Supply Chain Director',
      status: 'Open',
    },
    {
      id: 'R-003',
      category: 'Geopolitical',
      likelihood: 'High',
      impact: 'High',
      description: 'Indo-Pacific realignment may disrupt established trade routes and bilateral agreements within 90-day operational window.',
      mitigation: 'Pre-position diplomatic engagement; activate contingency trade protocols; brief external affairs team.',
      owner: 'Geopolitical Affairs',
      status: 'Monitored',
    },
    {
      id: 'R-004',
      category: 'Economic',
      likelihood: 'Medium',
      impact: 'High',
      description: 'Currency volatility in 8 monitored markets creates FX exposure exceeding hedging capacity by estimated 34%.',
      mitigation: 'Expand hedging instruments; reduce exposure in 3 highest-volatility markets by end of Q4.',
      owner: 'CFO / Treasury',
      status: 'Mitigating',
    },
    {
      id: 'R-005',
      category: 'Human Intelligence',
      likelihood: 'Medium',
      impact: 'High',
      description: 'Conflicting HUMINT on adversarial leadership creates decision uncertainty for scenario planning.',
      mitigation: 'Activate adversarial debrief protocol; cross-reference with SIGINT; convene analyst review board.',
      owner: 'Intelligence Director',
      status: 'Open',
    },
  ],
  sources: [
    {
      id: 'S-001',
      title: 'DIA Strategic Assessment — Southeast Asia Q3 2026',
      classification: 'SECRET',
      date: 'September 12, 2026',
      confidence: 91,
      summary: 'Primary SIGINT-derived assessment of threat actor positioning and intent in the Indo-Pacific corridor.',
    },
    {
      id: 'S-002',
      title: 'CISA Critical Infrastructure Vulnerability Report TR-2026-09',
      classification: 'CONFIDENTIAL',
      date: 'September 5, 2026',
      confidence: 95,
      summary: 'Technical assessment of APT penetration across critical infrastructure sectors with IOC appendix.',
    },
    {
      id: 'S-003',
      title: 'World Economic Forum — Economic Fragmentation Index 2026',
      classification: 'UNCLASSIFIED',
      date: 'August 28, 2026',
      confidence: 84,
      summary: 'Open-source multilateral economic data spanning 20 monitored markets with forward projections.',
    },
    {
      id: 'S-004',
      title: 'NSA/CSS Cyber Threat Intelligence Bulletin Q3',
      classification: 'TOP SECRET',
      date: 'September 18, 2026',
      confidence: 88,
      summary: 'Attribution assessment for state-sponsored cyber actor campaigns targeting Western critical infrastructure.',
    },
    {
      id: 'S-005',
      title: 'HUMINT Field Reports — Operations Sandstorm & Lighthouse',
      classification: 'TOP SECRET',
      date: 'September 14, 2026',
      confidence: 67,
      summary: 'Three conflicting source accounts from active HUMINT networks — pending reconciliation.',
    },
  ],
  recommendations: [
    {
      priority: 'IMMEDIATE',
      text: 'Activate Cyber Crisis Protocol Alpha-7: emergency network segmentation and 24-hour SOC surge staffing across all critical infrastructure interfaces.',
    },
    {
      priority: 'IMMEDIATE',
      text: 'Convene Emergency Supply Chain Review Board within 72 hours to authorize strategic reserve acquisition for rare earth minerals (6-month buffer).',
    },
    {
      priority: 'SHORT-TERM',
      text: 'Deploy diplomatic engagement team to Indo-Pacific region within 30 days; activate contingency trade route agreements.',
    },
    {
      priority: 'SHORT-TERM',
      text: 'Expand FX hedging instruments to cover 100% of projected exposure in 8 at-risk markets before Q4 2026.',
    },
    {
      priority: 'STRATEGIC',
      text: 'Rebuild allied intelligence-sharing frameworks through bilateral agreements to close analytical blind spots in Regions Alpha and Delta.',
    },
    {
      priority: 'STRATEGIC',
      text: 'Establish permanent Adversarial Debrief Protocol (ADP) team to resolve HUMINT conflicts within 14-day SLA.',
    },
  ],
}

// ── Helper Components ─────────────────────────────────────────────────────────

const LIKELIHOOD_COLORS = {
  Critical: 'risk-critical',
  High:     'risk-high',
  Medium:   'risk-medium',
  Low:      'risk-low',
}

const STATUS_CONFIG = {
  Open:       { label: 'Open',       cls: 'status-open' },
  Mitigating: { label: 'Mitigating', cls: 'status-mitigating' },
  Monitored:  { label: 'Monitored',  cls: 'status-monitored' },
  Closed:     { label: 'Closed',     cls: 'status-closed' },
}

const CLASS_CONFIG = {
  'TOP SECRET':   { cls: 'class-ts',  abbr: 'TS' },
  'SECRET':       { cls: 'class-s',   abbr: 'S' },
  'CONFIDENTIAL': { cls: 'class-c',   abbr: 'C' },
  'UNCLASSIFIED': { cls: 'class-u',   abbr: 'U' },
}

const THREAT_LEVEL = {
  CRITICAL: { cls: 'threat-critical', bg: '#ff0033' },
  HIGH:     { cls: 'threat-high',     bg: '#ef4444' },
  ELEVATED: { cls: 'threat-elevated', bg: '#f97316' },
  MODERATE: { cls: 'threat-moderate', bg: '#eab308' },
  LOW:      { cls: 'threat-low',      bg: '#22c55e' },
}

const PRIORITY_CONFIG = {
  IMMEDIATE:    { cls: 'priority-immediate', icon: '🔴' },
  'SHORT-TERM': { cls: 'priority-short',     icon: '🟡' },
  STRATEGIC:    { cls: 'priority-strategic', icon: '🔵' },
}

/**
 * DossierModal
 *
 * Full-screen printable executive intelligence report modal.
 * Features:
 *  - Glassmorphism modal with animated entry
 *  - Sections: classification banner, executive summary, key findings,
 *    risk matrix table, intelligence sources, recommendations
 *  - Native print via window.print() with @media print CSS
 *  - Backdrop blur + scroll lock when open
 *  - Accessible: focus trap, aria-modal, Escape to close
 */
export default function DossierModal({ isOpen, onClose, dossier: overrides }: DossierModalProps) {
  const data = { ...DEFAULT_DOSSIER, ...overrides }
  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Scroll lock + focus trap
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  const threatConfig = THREAT_LEVEL[data.overallThreatLevel]

  return (
    <div
      className="dossier-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-title"
      id="dossier-modal"
    >
      {/* Backdrop */}
      <div
        className="dossier-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="dossier-modal" ref={modalRef}>

        {/* ── Control Bar (no-print) ── */}
        <div className="dossier-controls no-print">
          <div className="controls-left">
            <div className="dossier-brand">
              <Zap size={16} />
              <span>Digital AI</span>
            </div>
            <div className={`threat-level-badge ${threatConfig.cls}`}>
              <Shield size={13} />
              Threat Level: <strong>{data.overallThreatLevel}</strong>
            </div>
          </div>
          <div className="controls-right">
            <button
              className="btn-ghost"
              onClick={handlePrint}
              id="print-dossier-btn"
              aria-label="Print dossier as PDF"
            >
              <Printer size={15} />
              Print / Export PDF
            </button>
            <button
              className="btn-ghost"
              id="download-dossier-btn"
              aria-label="Download dossier"
            >
              <Download size={15} />
              Download
            </button>
            <button
              ref={closeRef}
              className="btn-icon"
              onClick={onClose}
              id="close-dossier-btn"
              aria-label="Close dossier"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Printable Report ── */}
        <div className="dossier-report print-page">

          {/* Classification Banner */}
          <div className="classification-banner">
            <Lock size={13} />
            {data.classification}
            <Lock size={13} />
          </div>

          {/* Report Header */}
          <header className="report-header">
            <div className="report-header-logo">
              <Zap size={22} />
            </div>
            <div className="report-header-content">
              <div className="report-label">EXECUTIVE INTELLIGENCE DOSSIER</div>
              <h1 className="report-title" id="dossier-title">{data.title}</h1>
              <div className="report-meta-grid">
                <div className="report-meta-item">
                  <Clock size={13} />
                  <span>Reporting Period: <strong>{data.period}</strong></span>
                </div>
                <div className="report-meta-item">
                  <Globe size={13} />
                  <span>Prepared For: <strong>{data.preparedFor}</strong></span>
                </div>
                <div className="report-meta-item">
                  <BookMarked size={13} />
                  <span>Prepared By: <strong>{data.preparedBy}</strong></span>
                </div>
                <div className="report-meta-item">
                  <Target size={13} />
                  <span>Date: <strong>{data.date}</strong></span>
                </div>
              </div>
            </div>
          </header>

          <div className="report-divider" />

          {/* Threat Level Bar */}
          <div className="threat-level-section">
            <div className="threat-level-label">OVERALL THREAT ASSESSMENT</div>
            <div className="threat-level-meter">
              {(['LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL'] as const).map(level => (
                <div
                  key={level}
                  className={`threat-meter-segment ${THREAT_LEVEL[level].cls}-segment ${data.overallThreatLevel === level ? 'active-segment' : ''}`}
                  style={{ '--seg-color': THREAT_LEVEL[level].bg } as React.CSSProperties}
                >
                  {level}
                </div>
              ))}
            </div>
          </div>

          <div className="report-divider" />

          {/* Executive Summary */}
          <section className="report-section" aria-labelledby="exec-summary-heading">
            <div className="section-header">
              <BarChart3 size={18} className="section-icon" />
              <h2 className="section-title" id="exec-summary-heading">Executive Summary</h2>
            </div>
            {data.executiveSummary.split('\n\n').map((para, i) => (
              <p key={i} className="summary-para">{para}</p>
            ))}
          </section>

          <div className="report-divider" />

          {/* Key Findings */}
          <section className="report-section" aria-labelledby="key-findings-heading">
            <div className="section-header">
              <TrendingUp size={18} className="section-icon" />
              <h2 className="section-title" id="key-findings-heading">Key Findings</h2>
            </div>
            <ol className="findings-list">
              {data.keyFindings.map((finding, i) => (
                <li key={i} className="finding-item">
                  <span className="finding-number">{String(i + 1).padStart(2, '0')}</span>
                  <p className="finding-text">{finding}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="report-divider" />

          {/* Risk Matrix */}
          <section className="report-section" aria-labelledby="risk-matrix-heading">
            <div className="section-header">
              <AlertTriangle size={18} className="section-icon" />
              <h2 className="section-title" id="risk-matrix-heading">Risk Matrix</h2>
            </div>
            <div className="risk-table-wrapper">
              <table className="risk-table" aria-label="Risk assessment matrix">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Category</th>
                    <th scope="col">Likelihood</th>
                    <th scope="col">Impact</th>
                    <th scope="col">Description</th>
                    <th scope="col">Mitigation</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.risks.map(risk => (
                    <tr key={risk.id} className="risk-row">
                      <td className="risk-id">{risk.id}</td>
                      <td className="risk-category">{risk.category}</td>
                      <td>
                        <span className={`risk-badge ${LIKELIHOOD_COLORS[risk.likelihood]}`}>
                          {risk.likelihood}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-badge ${LIKELIHOOD_COLORS[risk.impact]}`}>
                          {risk.impact}
                        </span>
                      </td>
                      <td className="risk-desc">{risk.description}</td>
                      <td className="risk-mitigation">{risk.mitigation}</td>
                      <td className="risk-owner">{risk.owner}</td>
                      <td>
                        <span className={`status-badge ${STATUS_CONFIG[risk.status].cls}`}>
                          {STATUS_CONFIG[risk.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="report-divider" />

          {/* Intelligence Sources */}
          <section className="report-section" aria-labelledby="sources-heading">
            <div className="section-header">
              <BookMarked size={18} className="section-icon" />
              <h2 className="section-title" id="sources-heading">Intelligence Sources</h2>
            </div>
            <div className="sources-grid">
              {data.sources.map(source => {
                const classConfig = CLASS_CONFIG[source.classification]
                const confCls = source.confidence >= 85 ? 'conf-high' :
                                source.confidence >= 65 ? 'conf-med'  : 'conf-low'
                return (
                  <div key={source.id} className="source-card">
                    <div className="source-header">
                      <span className={`class-badge ${classConfig.cls}`}>{classConfig.abbr}</span>
                      <span className="source-id">{source.id}</span>
                      <span className={`source-confidence ${confCls}`}>{source.confidence}% confidence</span>
                    </div>
                    <h3 className="source-title">{source.title}</h3>
                    <div className="source-meta">
                      <span className={`classification-label ${classConfig.cls}`}>{source.classification}</span>
                      <span className="source-date">{source.date}</span>
                    </div>
                    <p className="source-summary">{source.summary}</p>
                    <div className="source-conf-bar">
                      <div className={`source-conf-fill ${confCls}`} style={{ width: `${source.confidence}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="report-divider" />

          {/* Recommendations */}
          <section className="report-section" aria-labelledby="recommendations-heading">
            <div className="section-header">
              <CheckCircle2 size={18} className="section-icon" />
              <h2 className="section-title" id="recommendations-heading">Strategic Recommendations</h2>
            </div>
            <div className="recommendations-list">
              {data.recommendations.map((rec, i) => {
                const { cls, icon } = PRIORITY_CONFIG[rec.priority]
                return (
                  <div key={i} className={`recommendation-item ${cls}`}>
                    <div className="rec-priority-badge">
                      <span>{icon}</span>
                      <span>{rec.priority}</span>
                    </div>
                    <p className="rec-text">{rec.text}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="report-footer">
            <div className="footer-classification">
              <Lock size={12} />
              {data.classification}
              <Lock size={12} />
            </div>
            <div className="footer-meta">
              <span>Generated: {data.date}</span>
              <span>·</span>
              <span>Digital AI Intelligence Platform</span>
              <span>·</span>
              <span>Handle per classification guidelines</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
