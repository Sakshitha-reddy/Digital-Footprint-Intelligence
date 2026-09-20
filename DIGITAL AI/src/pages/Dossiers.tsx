import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import DossierModal from '../components/export/DossierModal'

const DOSSIERS = [
  { id: 'D-001', title: 'Executive Intelligence Dossier — Q3 2026', classification: 'TOP SECRET', date: '2026-09-19', threat: 'HIGH' },
  { id: 'D-002', title: 'Indo-Pacific Threat Assessment', classification: 'SECRET', date: '2026-09-10', threat: 'HIGH' },
  { id: 'D-003', title: 'Economic Fragmentation Report Q3', classification: 'CONFIDENTIAL', date: '2026-09-01', threat: 'ELEVATED' },
]

const CLASS_COLOR: Record<string, string> = {
  'TOP SECRET':   'badge-rose',
  'SECRET':       'badge-amber',
  'CONFIDENTIAL': 'badge-blue',
  'UNCLASSIFIED': 'badge-emerald',
}

export default function Dossiers() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="page-content">
        <div className="page-header animate-fade-in-up" style={{ marginBottom: 28 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.625rem' }}>Dossier Library</h1>
            <p className="page-subtitle">Executive intelligence reports ready for print and distribution</p>
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)} id="create-dossier-btn">
            <Plus size={15} /> Create Dossier
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {DOSSIERS.map((d, i) => (
            <div
              key={d.id}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, cursor: 'pointer' }}
              onClick={() => setOpen(true)}
              id={`dossier-card-${d.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <FileText size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{d.id}</div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{d.title}</h3>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${CLASS_COLOR[d.classification] || 'badge-gray'}`} style={{ fontSize: '0.62rem' }}>{d.classification}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{d.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DossierModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
