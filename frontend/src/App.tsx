import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SimulatorPage from './pages/SimulatorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
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
