import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import SimulatorPage from './pages/SimulatorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import FormNodeViewPage from './pages/FormNodeViewPage'
import { AuthProvider } from './contexts/AuthContext'

// GitHub PagesのSPAルーティング対応：404.htmlからのリダイレクトを処理
function RedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const redirect = sessionStorage.redirect
    if (redirect) {
      delete sessionStorage.redirect
      // baseパスを除いたパスを取得
      const url = new URL(redirect)
      const path = url.pathname.replace('/Photo-Studio-Pricing-Simulator', '')
      navigate(path + url.search + url.hash)
    }
  }, [navigate])

  return null
}

function App() {
  // GitHub Pages用のbaseパス設定（vite.config.tsと一致させる）
  const basename = import.meta.env.PROD ? '/Photo-Studio-Pricing-Simulator/' : '/'

  return (
    <AuthProvider>
      <Router basename={basename}>
        <RedirectHandler />
        <Routes>
          <Route path="/" element={<SimulatorPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/forms/:formId/node-view" element={<FormNodeViewPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
