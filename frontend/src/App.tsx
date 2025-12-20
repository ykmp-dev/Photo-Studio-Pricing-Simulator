import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import SimulatorPage from './pages/SimulatorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import FormBlockEditorPage from './pages/FormBlockEditorPage'
import CustomerFormPageV3 from './pages/CustomerFormPageV3'
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
