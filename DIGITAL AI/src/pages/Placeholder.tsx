import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Placeholder() {
  const { pathname } = useLocation()
  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
      <h2 style={{ marginBottom: 8 }}>Access Restricted</h2>
      <p style={{ marginBottom: 24, maxWidth: 360 }}>
        The page <code style={{ fontSize: '0.85em', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{pathname}</code> requires elevated clearance.
      </p>
      <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ArrowLeft size={15} /> Return to Dashboard
      </Link>
    </div>
  )
}
