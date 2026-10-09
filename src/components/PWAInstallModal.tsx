import { usePWA } from '@/contexts/PWAContext'
import { Button } from '@/components/ui/button'
import {
  Download,
  Share,
  PlusSquare,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react'

export function PWAInstallModal() {
  const { showInstallModal, setShowInstallModal, isIOS, installApp } = usePWA()

  if (!showInstallModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 sm:p-6">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-xs">
                <Download className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  <Sparkles className="w-3 h-3" /> PWA Instalável
                </span>
                <h3 className="text-lg font-bold">Instalar Melero Nutri</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5 sm:p-6 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Instale o <strong>Sistema Melero Nutri</strong> no seu dispositivo para ter acesso rápido como um aplicativo nativo, tela cheia e funcionamento offline.
          </p>

          {isIOS ? (
            /* Instruções para iPhone / iPad no Safari */
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                Como instalar no seu iPhone ou iPad (Safari):
              </div>
              <ol className="text-xs text-slate-700 space-y-2.5 pl-1">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">1.</span>
                  <span>
                    Toque no botão de <strong>Compartilhar</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline mx-0.5 text-emerald-700" /> na barra inferior do Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">2.</span>
                  <span>
                    Role para baixo e selecione{' '}
                    <strong>"Adicionar à Tela de Início"</strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-700" />.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">3.</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito.</span>
                </li>
              </ol>
            </div>
          ) : (
            /* Instruções para Android / Windows / Chrome */
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Laptop className="w-4 h-4 text-emerald-600" />
                Vantagens do aplicativo instalado:
              </div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Acesso direto da sua tela inicial ou área de trabalho</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Experiência em tela cheia sem barras de navegação do browser</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Carregamento instantâneo com suporte offline seguro</span>
                </li>
              </ul>
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInstallModal(false)}
              className="text-xs text-slate-600 justify-center h-10 xs:h-9"
            >
              Agora Não
            </Button>

            {!isIOS && (
              <Button
                type="button"
                onClick={() => installApp()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-emerald-600/25 justify-center h-10 xs:h-9"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Instalar Aplicativo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
