import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { PWAProvider } from '@/contexts/PWAContext'
import { PWAInstallModal } from '@/components/PWAInstallModal'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { Pacientes } from '@/pages/Pacientes'
import { NovoPaciente } from '@/pages/NovoPaciente'
import { PerfilPaciente } from '@/pages/PerfilPaciente'
import { Layout } from '@/components/Layout'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'

export function App() {
  return (
    <PWAProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Rotas Protegidas com Layout Fixo e Sidebar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/novo" element={<NovoPaciente />} />
              <Route path="/pacientes/:id" element={<PerfilPaciente />} />
            </Route>
          </Route>

          {/* Rota Padrão / Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Notificações e Modais Globais do PWA */}
        <PWAInstallModal />
        <OfflineBanner />
      </BrowserRouter>
    </AuthProvider>
  </PWAProvider>
  )
}

export default App
