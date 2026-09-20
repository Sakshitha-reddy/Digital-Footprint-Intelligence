import { Layers } from 'lucide-react'

const SCENARIOS = [
  { id: 'STD-001', type: 'standard',     name: 'Indo-Pacific Shipping Lane Threat Assessment', conf: '75%', region: 'Indo-Pacific' },
  { id: 'STD-002', type: 'standard',     name: 'Economic Fragmentation — G20 Market Divergence', conf: '82%', region: 'Global' },
  { id: 'HC-001',  type: 'high_conf',    name: 'APT Infrastructure Compromise', conf: '92%', region: 'North America' },
  { id: 'HC-002',  type: 'high_conf',    name: 'HUMINT — Non-State Actor Prep', conf: '88%', region: 'Region Bravo' },
  { id: 'CONF-001',type: 'conflict',     name: 'Contradictory Leadership Assessment — Entity DELTA', conf: '63%', region: 'Region Alpha' },
  { id: 'CONF-002',type: 'conflict',     name: 'Supply Chain — Conflicting Timeline Reports', conf: '82%', region: 'East Asia' },
  { id: 'CONF-003',type: 'conflict',     name: 'Disinformation Hypothesis — Temporal Drift', conf: '54%', region: 'Region Delta' },
  { id: 'INSUF-001',type: 'insufficient',name: 'Sparse Coverage — Region Gamma Political Transition', conf: '35%', region: 'Region Gamma' },
  { id: 'INSUF-002',type: 'insufficient',name: 'Stale Intelligence — Adversary Order of Battle', conf: '21%', region: 'Region Echo' },
  { id: 'INSUF-003',type: 'insufficient',name: 'Low Coverage — Rare Earth Supply Chain Node', conf: '48%', region: 'Country ZULU' },
]

const TYPE_BADGE: Record<string, string> = {
  standard:     'badge-emerald',
  high_conf:    'badge-blue',
  conflict:     'badge-rose',
  insufficient: 'badge-amber',
}

const TYPE_LABEL: Record<string, string> = {
  standard:     'Standard',
  high_conf:    'High-Conf',
  conflict:     'Conflict',
  insufficient: 'Insufficient',
}

export default function Scenarios() {
  return (
    <div className="page-content">
      <div className="page-header animate-fade-in-up" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.625rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={22} style={{ color: 'var(--accent-primary)' }} />
            Benchmark Scenarios
          </h1>
          <p className="page-subtitle">All intelligence scenarios from <code style={{ fontSize: '0.8em', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>backend/data/benchmarks.py</code></p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <span key={k} className={`badge ${TYPE_BADGE[k]}`}>{v}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCENARIOS.map((s, i) => (
          <div
            key={s.id}
            className="card animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms`, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}
            id={`scenario-${s.id}`}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)', width: 72, flexShrink: 0 }}>{s.id}</div>
            <span className={`badge ${TYPE_BADGE[s.type]}`} style={{ fontSize: '0.62rem', flexShrink: 0 }}>{TYPE_LABEL[s.type]}</span>
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', minWidth: 0 }}>{s.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{s.region}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              color: parseFloat(s.conf) >= 80 ? '#34d399' : parseFloat(s.conf) >= 60 ? '#fbbf24' : '#fb7185' }}>
              {s.conf}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
