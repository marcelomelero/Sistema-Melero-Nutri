import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  BeforeInstallPromptEvent,
  registerServiceWorker,
  isAppInstalled,
  isIOSDevice,
} from '@/lib/pwa'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isIOS: boolean
  hasUpdate: boolean
  showInstallModal: boolean
  setShowInstallModal: (show: boolean) => void
  installApp: () => Promise<boolean>
  updateApp: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [hasUpdate, setHasUpdate] = useState<boolean>(false)
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false)
  const [isIOS, setIsIOS] = useState<boolean>(false)

  useEffect(() => {
    // Detecta status inicial
    setIsInstalled(isAppInstalled())
    setIsIOS(isIOSDevice())
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)

    // Registra Service Worker e ouvinte de atualização
    registerServiceWorker(() => {
      setHasUpdate(true)
    })

    // Captura evento de instalação nativo
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Detecta quando o aplicativo foi instalado com sucesso
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowInstallModal(false)
      console.log('[PWA] Aplicativo instalado com sucesso!')
    }

    // Monitora conectividade online / offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Dispara a instalação
  const installApp = async (): Promise<boolean> => {
    // Se estiver no iOS, abre instruções detalhadas
    if (isIOS) {
      setShowInstallModal(true)
      return true
    }

    if (!deferredPrompt) {
      // Se o prompt nativo ainda não foi disparado, abre o modal instrutivo
      setShowInstallModal(true)
      return false
    }

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (err) {
      console.error('[PWA] Erro ao disparar prompt de instalação:', err)
      setShowInstallModal(true)
      return false
    }
  }

  // Recarrega a aplicação com a nova versão do Service Worker
  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
  }

  const isInstallable = !isInstalled && (!!deferredPrompt || isIOS)

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        isIOS,
        hasUpdate,
        showInstallModal,
        setShowInstallModal,
        installApp,
        updateApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA deve ser utilizado dentro de um PWAProvider')
  }
  return context
}
