import { usePWA } from '@/contexts/PWAContext'
import { WifiOff, RefreshCw, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function OfflineBanner() {
  const { isOnline, hasUpdate, updateApp } = usePWA()
  const [dismissUpdate, setDismissUpdate] = useState(false)

  return (
    <>
      {/* Alerta de Modo Offline */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-amber-900/95 text-white p-3.5 rounded-2xl shadow-xl backdrop-blur-md border border-amber-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-800 text-amber-200 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Modo Offline Ativo</p>
              <p className="text-[11px] text-amber-200 mt-0.5">
                Você está sem conexão, mas o Melero Nutri continua funcionando pelo cache PWA.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Nova Versão do PWA disponível */}
      {hasUpdate && !dismissUpdate && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-emerald-900/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight">Atualização Disponível</p>
              <p className="text-[11px] text-emerald-200 mt-0.5 truncate">
                Uma nova versão do sistema está pronta para uso.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={updateApp}
              className="bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold h-8 px-3 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Atualizar
            </Button>
            <button
              type="button"
              onClick={() => setDismissUpdate(true)}
              className="text-emerald-300 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
