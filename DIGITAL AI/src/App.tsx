import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Intelligence from './pages/Intelligence'
import Dossiers from './pages/Dossiers'
import CopilotPage from './pages/CopilotPage'
import Scenarios from './pages/Scenarios'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/dossiers"     element={<Dossiers />} />
            <Route path="/copilot"      element={<CopilotPage />} />
            <Route path="/scenarios"    element={<Scenarios />} />
            <Route path="*"             element={<Placeholder />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
