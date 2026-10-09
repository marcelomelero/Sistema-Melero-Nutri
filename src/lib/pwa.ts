// Utilitários de Registro e Gerenciamento do PWA

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Registra o Service Worker
export function registerServiceWorker(onUpdate?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Verifica se há uma nova versão disponível
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Nova versão encontrada e pronta para ativação
              console.log('[PWA] Nova versão disponível!')
              if (onUpdate) onUpdate()
            }
          })
        })
      })
      .catch((error) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', error)
      })
  })
}

// Detecta se a aplicação já está rodando em modo Standalone (PWA instalado)
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (window.navigator as any).standalone === true

  return isStandalone || isIOSStandalone
}

// Detecta se o dispositivo é iOS (iPhone, iPad, iPod)
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}
