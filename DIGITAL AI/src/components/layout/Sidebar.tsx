import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Brain,
  FileText,
  MessageSquareQuote,
  Layers,
  Shield,
  Settings,
  Zap,
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { to: '/',             icon: LayoutDashboard,     label: 'Dashboard' },
  { to: '/intelligence', icon: Brain,               label: 'Intelligence' },
  { to: '/dossiers',     icon: FileText,            label: 'Dossiers' },
  { to: '/copilot',      icon: MessageSquareQuote,  label: 'AI Copilot' },
  { to: '/scenarios',    icon: Layers,              label: 'Scenarios' },
  { to: '/risk',         icon: Shield,              label: 'Risk Matrix' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={18} strokeWidth={2.5} />
        </div>
        <div className="logo-text">
          <span className="logo-name">Digital AI</span>
          <span className="logo-tagline">Intelligence Platform</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} className="nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item">
          <Settings size={18} strokeWidth={1.8} className="nav-icon" />
          <span>Settings</span>
        </NavLink>

        <div className="sidebar-user">
          <div className="user-avatar">EI</div>
          <div className="user-info">
            <span className="user-name">Exec Intel</span>
            <span className="user-role">Analyst · Pro</span>
          </div>
          <div className="user-status" />
        </div>
      </div>
    </aside>
  )
}
