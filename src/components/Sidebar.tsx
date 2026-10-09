import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePWA } from '@/contexts/PWAContext'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, LogOut, Menu, X, Download, Sparkles } from 'lucide-react'

export function Sidebar() {
  const { user, logout } = useAuth()
  const { isInstalled, installApp } = usePWA()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fecha o menu mobile automaticamente ao mudar de rota
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Bloqueia a rolagem do body quando o menu mobile está aberto e fecha com tecla ESC
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Pacientes',
      path: '/pacientes',
      icon: Users,
    },
  ]

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-xs h-16">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5">
          {!isInstalled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => installApp()}
              className="text-emerald-700 hover:bg-emerald-50 border-emerald-200/90 text-xs font-semibold px-2.5 h-8 shadow-2xs"
              title="Instalar aplicativo"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Instalar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 hover:text-emerald-700 active:scale-95 transition-transform"
            aria-label="Abrir ou fechar menu de navegação"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container com overflow-y-auto para suportar telas de baixa altura / paisagem */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 max-w-[85vw] bg-white border-r border-slate-200/90 shadow-lg lg:shadow-xs
          flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header & Logo */}
        <div className="flex flex-col flex-1">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Logo size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Principal
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                    ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs border border-emerald-200/60'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* PWA Banner de Instalação no Menu Lateral */}
        {!isInstalled && (
          <div className="mx-3.5 my-2 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> App PWA
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                Disponível
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2.5 leading-snug">
              Instale para acesso rápido na sua tela inicial e suporte offline.
            </p>
            <Button
              size="sm"
              onClick={() => installApp()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 justify-center shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Instalar Aplicativo
            </Button>
          </div>
        )}

        {/* User Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Nutricionista'}</span>
              <span className="text-[11px] text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors text-xs font-medium h-9"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </aside>
    </>
  )
}
