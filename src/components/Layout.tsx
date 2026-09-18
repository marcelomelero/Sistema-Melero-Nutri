import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Fixo */}
      <Sidebar />

      {/* Conteúdo Principal Ajustado ao Sidebar */}
      <div className="flex-1 lg:ml-64 min-w-0 pt-16 lg:pt-0">
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
