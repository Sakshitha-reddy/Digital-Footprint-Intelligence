import { useState } from 'react'
import { Brain, Globe, Shield, TrendingUp } from 'lucide-react'
import RagChatDrawer from '../components/copilot/RagChatDrawer'

const INTEL_ITEMS = [
  { id: 'I-001', region: 'Indo-Pacific', type: 'SIGINT', title: 'Maritime Patrol Density Increase', confidence: 91, threat: 'HIGH', date: '2026-09-18' },
  { id: 'I-002', region: 'Global',       type: 'OSINT',  title: 'Economic Fragmentation Threshold Crossed', confidence: 84, threat: 'ELEVATED', date: '2026-09-15' },
  { id: 'I-003', region: 'Region Bravo', type: 'HUMINT', title: 'Non-State Actor Operational Prep', confidence: 88, threat: 'CRITICAL', date: '2026-09-17' },
  { id: 'I-004', region: 'North America','type': 'TECHINT', title: 'APT Persistent Access — SCADA', confidence: 95, threat: 'CRITICAL', date: '2026-09-18' },
]

const THREAT_BADGE: Record<string, string> = { CRITICAL: 'badge-rose', HIGH: 'badge-amber', ELEVATED: 'badge-blue', MODERATE: 'badge-gray' }

export default function Intelligence() {
  const [chatOpen, setChatOpen] = useState(false)
  return (
    <>
      <div className="page-content">
        <div className="page-header animate-fade-in-up" style={{ marginBottom: 28 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.625rem' }}>Intelligence Feed</h1>
            <p className="page-subtitle">Live cross-source intelligence across all monitored regions</p>
          </div>
          <button className="btn-primary" onClick={() => setChatOpen(true)} id="intel-copilot-btn">
            <Brain size={15} /> Query Copilot
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {INTEL_ITEMS.map((item, i) => (
            <div
              key={item.id}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, display: 'flex', alignItems: 'center', gap: 20, padding: '16px 24px' }}
              id={`intel-item-${item.id}`}
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>{item.id}</div>
              <div style={{ width: 70, flexShrink: 0 }}>
                <span className="badge badge-violet" style={{ fontSize: '0.62rem' }}>{item.type}</span>
              </div>
              <Globe size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.region} · {item.date}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: item.confidence >= 85 ? '#34d399' : '#fbbf24', flexShrink: 0 }}>{item.confidence}%</div>
              <span className={`badge ${THREAT_BADGE[item.threat] || 'badge-gray'}`}>{item.threat}</span>
            </div>
          ))}
        </div>
      </div>
      <RagChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  )
}
