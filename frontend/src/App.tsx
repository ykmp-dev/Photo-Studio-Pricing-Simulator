import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import SimulatorPage from './pages/SimulatorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import FormBlockEditorPage from './pages/FormBlockEditorPage'
import CustomerFormPageV3 from './pages/CustomerFormPageV3'
import { AuthProvider } from './contexts/AuthContext'

// SPAルーティング対応：404.htmlからのリダイレクトを処理
function RedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const redirect = sessionStorage.redirect
    if (redirect) {
      delete sessionStorage.redirect
      // baseパスを除いたパスを取得
      const url = new URL(redirect)
      const basePath = import.meta.env.VITE_BASE_PATH || '/Photo-Studio-Pricing-Simulator/y_sogo/simulation/'
      const path = url.pathname.replace(basePath.replace(/\/$/, ''), '')
      navigate(path + url.search + url.hash)
    }
  }, [navigate])

  return null
}

function App() {
  // 環境変数からbaseパスを取得（GitHub Pages用）
  const basename = import.meta.env.VITE_BASE_PATH ||
    (import.meta.env.PROD ? '/Photo-Studio-Pricing-Simulator/y_sogo/simulation/' : '/')

  return (
    <AuthProvider>
      <Router basename={basename}>
        <RedirectHandler />
        <Routes>
          <Route path="/" element={<CustomerFormPageV3 />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/form/v3/:shopId" element={<CustomerFormPageV3 />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/forms/:formId/edit" element={<FormBlockEditorPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
