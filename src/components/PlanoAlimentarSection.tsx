import { useState, useEffect } from 'react'
import { PlanoAlimentar, createPlanoAlimentar, Paciente } from '@/lib/db'
import { formatDateBR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sparkles,
  Utensils,
  Calendar,
  Save,
  Clock,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  RotateCcw,
  Edit3,
  X,
} from 'lucide-react'

export interface RefeicoesDia {
  cafe_da_manha: string[]
  lanche_manha: string[]
  almoco: string[]
  lanche_tarde: string[]
  jantar: string[]
}

export interface DiaPlano {
  dia: string
  refeicoes: RefeicoesDia
}

export interface PlanoSemanalData {
  plano_semanal: DiaPlano[]
}

const DIAS_PADRAO = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
]

const NOMES_REFEICOES: Record<keyof RefeicoesDia, { label: string; icon: string }> = {
  cafe_da_manha: { label: 'Café da Manhã', icon: '☕' },
  lanche_manha: { label: 'Lanche da Manhã', icon: '🍎' },
  almoco: { label: 'Almoço', icon: '🥗' },
  lanche_tarde: { label: 'Lanche da Tarde', icon: '🥪' },
  jantar: { label: 'Jantar', icon: '🍲' },
}

// Cria um modelo inicial padrão vazio/manual com 5 opções por refeição
export function createEmptyPlanoSemanal(): PlanoSemanalData {
  return {
    plano_semanal: DIAS_PADRAO.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    })),
  }
}

interface PlanoAlimentarSectionProps {
  paciente: Paciente
  planos: PlanoAlimentar[]
  onPlanoSaved: (novoPlano: PlanoAlimentar) => void
}

export function PlanoAlimentarSection({ paciente, planos, onPlanoSaved }: PlanoAlimentarSectionProps) {
  // Estado do plano em edição
  const [currentPlano, setCurrentPlano] = useState<PlanoSemanalData | null>(null)
  const [activeDiaTab, setActiveDiaTab] = useState<number>(0)

  // Estados de IA e Carregamento
  const [generatingIA, setGeneratingIA] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  // Mensagens de Feedback
  const [successToast, setSuccessToast] = useState('')
  const [errorToast, setErrorToast] = useState('')

  // Modal de visualização de plano salvo
  const [viewingPlano, setViewingPlano] = useState<PlanoAlimentar | null>(null)
  const [viewingDiaTab, setViewingDiaTab] = useState<number>(0)

  // Mensagens dinâmicas de carregamento
  const loadingMessages = [
    'Buscando dados clínicos e preferências do paciente...',
    'IA analisando metas, restrições e histórico alimentar...',
    'Calculando combinações balanceadas para a culinária brasileira...',
    'Estruturando 5 refeições com 5 opções diárias para a semana...',
    'Finalizando o plano alimentar estruturado...',
  ]

  useEffect(() => {
    let interval: any
    if (generatingIA) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
      }, 3500)
    } else {
      setLoadingMessageIndex(0)
    }
    return () => clearInterval(interval)
  }, [generatingIA])

  // Normaliza o conteúdo do plano (caso venha como string JSON do Neon)
  const parseConteudoPlano = (conteudo: any): PlanoSemanalData | null => {
    if (!conteudo) return null
    try {
      const data = typeof conteudo === 'string' ? JSON.parse(conteudo) : conteudo
      if (data?.plano_semanal && Array.isArray(data.plano_semanal)) {
        return data as PlanoSemanalData
      }
      if (Array.isArray(data)) {
        return { plano_semanal: data }
      }
      return null
    } catch (e) {
      console.error('Erro ao fazer parse do plano:', e)
      return null
    }
  }

  // Gera o plano via IA chamando a rota `/api/gerar-plano`
  const handleGerarPlanoIA = async () => {
    setErrorToast('')
    setSuccessToast('')
    setGeneratingIA(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 65000)

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paciente }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro na requisição (Status: ${response.status})`)
      }

      const data = await response.json()
      const parsed = parseConteudoPlano(data)

      if (!parsed || !parsed.plano_semanal || parsed.plano_semanal.length === 0) {
        throw new Error('A IA não retornou um formato de plano alimentar válido.')
      }

      // Garante que cada refeição tenha ao menos 5 opções
      const sanitized: PlanoSemanalData = {
        plano_semanal: parsed.plano_semanal.map((dia) => ({
          dia: dia.dia || 'Dia',
          refeicoes: {
            cafe_da_manha: Array.isArray(dia.refeicoes?.cafe_da_manha)
              ? dia.refeicoes.cafe_da_manha
              : ['', '', '', '', ''],
            lanche_manha: Array.isArray(dia.refeicoes?.lanche_manha)
              ? dia.refeicoes.lanche_manha
              : ['', '', '', '', ''],
            almoco: Array.isArray(dia.refeicoes?.almoco)
              ? dia.refeicoes.almoco
              : ['', '', '', '', ''],
            lanche_tarde: Array.isArray(dia.refeicoes?.lanche_tarde)
              ? dia.refeicoes.lanche_tarde
              : ['', '', '', '', ''],
            jantar: Array.isArray(dia.refeicoes?.jantar)
              ? dia.refeicoes.jantar
              : ['', '', '', '', ''],
          },
        })),
      }

      setCurrentPlano(sanitized)
      setActiveDiaTab(0)
      setSuccessToast('Plano alimentar semanal gerado com sucesso pela IA! Revise e edite as opções abaixo.')
      setTimeout(() => setSuccessToast(''), 6000)
    } catch (err: any) {
      console.error('Erro ao gerar plano alimentar com IA:', err)
      setErrorToast(
        'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?'
      )
    } finally {
      setGeneratingIA(false)
    }
  }

  // Cria um plano manual em branco
  const handleCriarPlanoManual = () => {
    setErrorToast('')
    const novo = createEmptyPlanoSemanal()
    setCurrentPlano(novo)
    setActiveDiaTab(0)
    setSuccessToast('Modelo de plano alimentar criado. Preencha as opções desejadas para cada refeição.')
    setTimeout(() => setSuccessToast(''), 4000)
  }

  // Atualiza uma opção específica de uma refeição do dia ativo
  const handleUpdateOpcao = (
    refeicaoKey: keyof RefeicoesDia,
    opcaoIndex: number,
    novoValor: string
  ) => {
    if (!currentPlano) return

    const updatedDias = [...currentPlano.plano_semanal]
    const diaAtual = { ...updatedDias[activeDiaTab] }
    const refeicoesAtual = { ...diaAtual.refeicoes }
    const opcoesAtual = [...refeicoesAtual[refeicaoKey]]

    opcoesAtual[opcaoIndex] = novoValor
    refeicoesAtual[refeicaoKey] = opcoesAtual
    diaAtual.refeicoes = refeicoesAtual
    updatedDias[activeDiaTab] = diaAtual

    setCurrentPlano({ plano_semanal: updatedDias })
  }

  // Adiciona uma nova opção à refeição
  const handleAddOpcao = (refeicaoKey: keyof RefeicoesDia) => {
    if (!currentPlano) return

    const updatedDias = [...currentPlano.plano_semanal]
    const diaAtual = { ...updatedDias[activeDiaTab] }
    const refeicoesAtual = { ...diaAtual.refeicoes }
    const opcoesAtual = [...refeicoesAtual[refeicaoKey], '']

    refeicoesAtual[refeicaoKey] = opcoesAtual
    diaAtual.refeicoes = refeicoesAtual
    updatedDias[activeDiaTab] = diaAtual

    setCurrentPlano({ plano_semanal: updatedDias })
  }

  // Remove uma opção da refeição
  const handleRemoveOpcao = (refeicaoKey: keyof RefeicoesDia, index: number) => {
    if (!currentPlano) return

    const updatedDias = [...currentPlano.plano_semanal]
    const diaAtual = { ...updatedDias[activeDiaTab] }
    const refeicoesAtual = { ...diaAtual.refeicoes }
    const opcoesAtual = refeicoesAtual[refeicaoKey].filter((_, i) => i !== index)

    refeicoesAtual[refeicaoKey] = opcoesAtual
    diaAtual.refeicoes = refeicoesAtual
    updatedDias[activeDiaTab] = diaAtual

    setCurrentPlano({ plano_semanal: updatedDias })
  }

  // Salva o plano alimentar gerado/editado no Neon
  const handleSalvarPlano = async () => {
    if (!currentPlano || !paciente.id) return

    setSaving(true)
    setErrorToast('')
    try {
      const saved = await createPlanoAlimentar({
        paciente_id: paciente.id,
        conteudo: currentPlano,
      })

      onPlanoSaved(saved)
      setSuccessToast('Plano alimentar salvo com sucesso no prontuário do paciente!')
      setTimeout(() => setSuccessToast(''), 5000)
    } catch (err: any) {
      console.error('Erro ao salvar plano no Neon:', err)
      setErrorToast(err?.message || 'Erro ao persistir plano no banco de dados.')
    } finally {
      setSaving(false)
    }
  }

  const diaAtivoObj = currentPlano?.plano_semanal[activeDiaTab]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Principal da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" />
            Planos Alimentares Semanais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere cardápios personalizados com IA, edite opções por refeição e mantenha o histórico completo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCriarPlanoManual}
            disabled={generatingIA || saving}
            className="text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Criar Manual
          </Button>

          <Button
            type="button"
            onClick={handleGerarPlanoIA}
            disabled={generatingIA || saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-emerald-600/25 transition-all"
          >
            {generatingIA ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Gerando com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5 text-emerald-200" />
                ✨ Gerar Plano com IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading Animado com Mensagens Dinâmicas da IA */}
      {generatingIA && (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm p-6 text-center animate-in fade-in">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                Gerando Plano Alimentar Personalizado
              </h3>
              <p className="text-xs text-emerald-700 mt-1.5 font-medium min-h-[20px] transition-all">
                {loadingMessages[loadingMessageIndex]}
              </p>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-1.5 rounded-full animate-progress" />
            </div>
          </div>
        </Card>
      )}

      {/* Alertas de Notificação */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-xs sm:text-sm flex-1">{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast('')}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">{errorToast}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGerarPlanoIA}
              className="text-xs bg-white text-red-700 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Tentar Novamente
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCriarPlanoManual}
              className="text-xs bg-red-700 hover:bg-red-800 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Plano Manual
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          TELA DE EDIÇÃO DO PLANO ALIMENTAR (Abas dos Dias da Semana)
          ======================================================== */}
      {currentPlano && (
        <Card className="border-emerald-200 shadow-md bg-white overflow-hidden animate-in fade-in">
          {/* Header do Formulário de Edição */}
          <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-slate-50 border-b border-emerald-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Modo de Edição Ativo
                  </span>
                  <CardTitle className="text-base sm:text-lg text-slate-900 font-bold">
                    Cardápio Semanal Estruturado
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Selecione o dia da semana nas abas e ajuste diretamente as 5 opções de cada refeição.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPlano(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar / Fechar
                </Button>

                <Button
                  type="button"
                  onClick={handleSalvarPlano}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Salvar Plano Alimentar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Abas dos Dias da Semana */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1 no-scrollbar">
              {currentPlano.plano_semanal.map((diaObj, idx) => (
                <button
                  key={diaObj.dia || idx}
                  type="button"
                  onClick={() => setActiveDiaTab(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    activeDiaTab === idx
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50/60 hover:border-emerald-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5 opacity-80" />
                  {diaObj.dia}
                </button>
              ))}
            </div>
          </CardHeader>

          {/* Conteúdo das Refeições do Dia Ativo */}
          <CardContent className="p-4 sm:p-6 space-y-6">
            {diaAtivoObj ? (
              <div className="space-y-6">
                {(
                  Object.keys(NOMES_REFEICOES) as Array<keyof RefeicoesDia>
                ).map((refeicaoKey) => {
                  const info = NOMES_REFEICOES[refeicaoKey]
                  const opcoes = diaAtivoObj.refeicoes[refeicaoKey] || []

                  return (
                    <div
                      key={refeicaoKey}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{info.icon}</span>
                          <h4 className="text-sm font-bold text-slate-800">{info.label}</h4>
                          <span className="text-[11px] font-semibold text-slate-400">
                            ({opcoes.length} {opcoes.length === 1 ? 'opção' : 'opções'})
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddOpcao(refeicaoKey)}
                          className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Opção
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {opcoes.map((opcaoTexto, opIdx) => (
                          <div key={opIdx} className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 w-16 text-center">
                              Opção {opIdx + 1}
                            </span>
                            <Input
                              value={opcaoTexto}
                              placeholder={`Ex: 2 fatias de pão integral com ovos mexidos e café sem açúcar...`}
                              onChange={(e) =>
                                handleUpdateOpcao(refeicaoKey, opIdx, e.target.value)
                              }
                              className="h-9 text-xs sm:text-sm bg-white border-slate-200 focus-visible:ring-emerald-500 font-medium"
                            />
                            {opcoes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOpcao(refeicaoKey, opIdx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Remover esta opção"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Selecione um dia da semana acima para editar as refeições.
              </div>
            )}

            {/* Rodapé do Formulário de Edição */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPlano(null)}
                className="text-xs text-slate-600"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleSalvarPlano}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md px-5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Salvando Plano...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Salvar Plano Alimentar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================
          HISTÓRICO DE PLANOS ALIMENTARES SALVOS
          ======================================================== */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Histórico de Planos Salvos
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Todos os planos prescritos e registrados para este paciente.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {planos.length} {planos.length === 1 ? 'plano' : 'planos'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {planos.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <Utensils className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Nenhum plano alimentar gerado ainda
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                Clique no botão "✨ Gerar Plano com IA" acima para criar um cardápio semanal completo ou monte manualmente.
              </p>
              <Button
                type="button"
                onClick={handleGerarPlanoIA}
                disabled={generatingIA}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Gerar Primeiro Plano com IA
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {planos.map((plano, index) => {
                const parsedPlano = parseConteudoPlano(plano.conteudo)
                const totalDias = parsedPlano?.plano_semanal?.length || 7

                return (
                  <div
                    key={plano.id}
                    onClick={() => {
                      setViewingPlano(plano)
                      setViewingDiaTab(0)
                    }}
                    className="p-5 hover:bg-emerald-50/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        #{planos.length - index}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                            Plano Alimentar Semanal Prescrito
                          </h4>
                          {index === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Atual
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Gerado em {formatDateBR(plano.created_at)}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            {totalDias} dias estruturados
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-emerald-600 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Ver Conteúdo Completo
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================
          MODAL DE VISUALIZAÇÃO DETALHADA DO PLANO SALVO
          ======================================================== */}
      {viewingPlano && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  Plano Alimentar Prescrito
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paciente: <span className="font-semibold text-slate-700">{paciente.nome}</span> • Gerado em{' '}
                  {formatDateBR(viewingPlano.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingPlano(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas dos Dias da Semana do Plano Salvo */}
            {(() => {
              const parsed = parseConteudoPlano(viewingPlano.conteudo)
              if (!parsed || !parsed.plano_semanal) {
                return (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Formato de conteúdo não estruturado.
                  </div>
                )
              }

              const diaSelecionado = parsed.plano_semanal[viewingDiaTab]

              return (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Navegador de Abas dos Dias */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
                    {parsed.plano_semanal.map((diaObj, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setViewingDiaTab(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          viewingDiaTab === idx
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {diaObj.dia}
                      </button>
                    ))}
                  </div>

                  {/* Refeições do Dia */}
                  {diaSelecionado ? (
                    <div className="space-y-4 pt-1">
                      {(
                        Object.keys(NOMES_REFEICOES) as Array<keyof RefeicoesDia>
                      ).map((refeicaoKey) => {
                        const info = NOMES_REFEICOES[refeicaoKey]
                        const opcoes = diaSelecionado.refeicoes[refeicaoKey] || []

                        return (
                          <div
                            key={refeicaoKey}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <span>{info.icon}</span>
                              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {info.label}
                              </h5>
                            </div>

                            <ul className="space-y-1.5 pl-6 list-disc text-xs text-slate-700">
                              {opcoes
                                .filter((op) => op && op.trim() !== '')
                                .map((op, i) => (
                                  <li key={i} className="leading-relaxed font-medium">
                                    {op}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })()}

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const parsed = parseConteudoPlano(viewingPlano.conteudo)
                  if (parsed) {
                    setCurrentPlano(parsed)
                    setViewingPlano(null)
                    setSuccessToast('Plano carregado no editor para ajustes!')
                  }
                }}
                className="text-xs font-semibold text-slate-700 hover:text-emerald-700"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Editar este Plano
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingPlano(null)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
