import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SimulatorPage from './pages/SimulatorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  // GitHub Pages用のbaseパス設定（vite.config.tsと一致させる）
  const basename = import.meta.env.PROD ? '/Photo-Studio-Pricing-Simulator/' : '/'

  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<SimulatorPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
