import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  getNutricionistaByEmail,
  getPacienteById,
  updatePaciente,
  getConsultasByPaciente,
  createConsulta,
  getPlanosAlimentaresByPaciente,
  Paciente,
  Consulta,
  PlanoAlimentar,
} from '@/lib/db'
import { formatPhone, formatTimeInput, calculateAge, calculateIMC, formatDateBR } from '@/lib/utils'
import { WeightChart } from '@/components/WeightChart'
import { PlanoAlimentarSection } from '@/components/PlanoAlimentarSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  HeartPulse,
  Coffee,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Target,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Save,
  Plus,
  X,
  Copy,
  CalendarPlus,
  Utensils,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// Opções padrão conforme o design do sistema
const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
]

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
]

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
]

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
]

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
]

export function PerfilPaciente() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Seção Principal ativa (Prompt 5: 3 Seções)
  const [activeSection, setActiveSection] = useState<'dados' | 'consultas' | 'planos'>('dados')

  // Aba interna da Seção 1 (Dados do Paciente: Pessoal, Clínico, Hábitos)
  const [activeTabDados, setActiveTabDados] = useState<1 | 2 | 3>(1)

  // Estados principais de dados
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])
  const [loading, setLoading] = useState(true)
  const [nutricionistaId, setNutricionistaId] = useState<string | null>(null)

  // Feedback de salvamento
  const [saveLoading, setSaveLoading] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [feedbackError, setFeedbackError] = useState('')

  // ==========================================
  // ESTADOS DO FORMULÁRIO DE EDIÇÃO DO PACIENTE
  // ==========================================
  // Aba 1: Pessoal
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  // Aba 2: Clínico
  const [pesoKg, setPesoKg] = useState('')
  const [alturaCm, setAlturaCm] = useState('')
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [objetivoTexto, setObjetivoTexto] = useState('')
  const [nivelAtividade, setNivelAtividade] = useState('Sedentário')
  const [patologias, setPatologias] = useState<string[]>([])
  const [novaPatologia, setNovaPatologia] = useState('')
  const [restricoes, setRestricoes] = useState<string[]>([])
  const [novaRestricao, setNovaRestricao] = useState('')
  const [alergias, setAlergias] = useState<string[]>([])
  const [novaAlergia, setNovaAlergia] = useState('')
  const [medicamentos, setMedicamentos] = useState('')
  const [suplementos, setSuplementos] = useState('')

  // Aba 3: Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState('')
  const [praticaAtividade, setPraticaAtividade] = useState(false)
  const [atividadeDescricao, setAtividadeDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // ==========================================
  // ESTADOS DO MODAL DE NOVA CONSULTA
  // ==========================================
  const [showModalConsulta, setShowModalConsulta] = useState(false)
  const [consultaLoading, setConsultaLoading] = useState(false)
  const [consultaError, setConsultaError] = useState('')
  const [novaConsultaData, setNovaConsultaData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  })


  // Carrega dados completos do paciente, consultas e planos
  const loadData = async () => {
    if (!id || !user?.email) return
    setLoading(true)
    try {
      const nutri = await getNutricionistaByEmail(user.email)
      if (nutri?.id) {
        setNutricionistaId(nutri.id)

        const [pacienteData, consultasData, planosData] = await Promise.all([
          getPacienteById(id, nutri.id),
          getConsultasByPaciente(id),
          getPlanosAlimentaresByPaciente(id),
        ])

        if (pacienteData) {
          setPaciente(pacienteData)
          // Preenche os campos do formulário com os dados carregados
          setNome(pacienteData.nome || '')
          setDataNascimento(pacienteData.data_nascimento || '')
          setSexo((pacienteData.sexo as any) || 'Feminino')
          setTelefone(pacienteData.telefone || '')
          setWhatsapp(pacienteData.whatsapp || '')
          setEmail(pacienteData.email || '')

          setPesoKg(pacienteData.peso_inicial ? String(pacienteData.peso_inicial) : '')
          setAlturaCm(pacienteData.altura ? String(pacienteData.altura) : '')
          setObjetivos(pacienteData.objetivos || [])
          setObjetivoTexto(pacienteData.objetivo_texto || '')
          setNivelAtividade(pacienteData.nivel_atividade || 'Sedentário')
          setPatologias(pacienteData.patologias || [])
          setRestricoes(pacienteData.restricoes_alimentares || [])
          setAlergias(pacienteData.alergias || [])
          setMedicamentos(pacienteData.medicamentos || '')
          setSuplementos(pacienteData.suplementos || '')

          setRefeicoesPorDia(pacienteData.refeicoes_por_dia ? String(pacienteData.refeicoes_por_dia) : '')
          setHorarioAcorda(pacienteData.horario_acorda || '')
          setHorarioDorme(pacienteData.horario_dorme || '')
          setLitrosAgua(pacienteData.litros_agua ? String(pacienteData.litros_agua) : '')
          setPraticaAtividade(!!pacienteData.atividade_fisica)
          setAtividadeDescricao(pacienteData.atividade_fisica_descricao || '')
          setObservacoes(pacienteData.observacoes || '')
        }

        setConsultas(consultasData)
        setPlanos(planosData)
      }
    } catch (err) {
      console.error('Erro ao carregar prontuário completo do paciente:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, user?.email])

  // Cálculos dinâmicos da Seção 1
  const idadeInfo = useMemo(() => calculateAge(dataNascimento), [dataNascimento])
  const imcInfo = useMemo(() => calculateIMC(pesoKg, alturaCm), [pesoKg, alturaCm])

  // Link para o WhatsApp
  const whatsappUrl = useMemo(() => {
    if (!whatsapp) return null
    const cleanDigits = whatsapp.replace(/\D/g, '')
    if (cleanDigits.length < 10) return null
    const fullNumber = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`
    return `https://wa.me/${fullNumber}`
  }, [whatsapp])

  // Handlers para campos multi-escolha com suporte a "Nenhum" e adição livre
  const handleToggleOption = (
    list: string[],
    setList: (val: string[]) => void,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setList([])
      } else {
        setList(['Nenhum'])
      }
      return
    }

    const withoutNenhum = list.filter((i) => i !== 'Nenhum')
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((i) => i !== item))
    } else {
      setList([...withoutNenhum, item])
    }
  }

  const handleAddCustomItem = (
    newItem: string,
    setNewItem: (val: string) => void,
    list: string[],
    setList: (val: string[]) => void
  ) => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    const withoutNenhum = list.filter((i) => i !== 'Nenhum')
    if (!withoutNenhum.includes(trimmed)) {
      setList([...withoutNenhum, trimmed])
    }
    setNewItem('')
  }

  const handleRemoveItem = (
    item: string,
    list: string[],
    setList: (val: string[]) => void
  ) => {
    setList(list.filter((i) => i !== item))
  }

  // Salva alterações dos Dados do Paciente (Seção 1)
  const handleSaveDados = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!id || !nutricionistaId) return

    setFeedbackError('')
    setFeedbackSuccess('')

    if (!nome.trim()) {
      setActiveTabDados(1)
      setFeedbackError('O campo Nome Completo é obrigatório.')
      return
    }

    setSaveLoading(true)
    try {
      const pesoNum = pesoKg ? parseFloat(pesoKg.replace(',', '.')) : null
      const alturaNum = alturaCm ? parseFloat(alturaCm.replace(',', '.')) : null
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null
      const aguaNum = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null

      const updated = await updatePaciente(id, nutricionistaId, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        peso_inicial: pesoNum,
        altura: alturaNum,
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesNum,
        horario_acorda: horarioAcorda.trim() || null,
        horario_dorme: horarioDorme.trim() || null,
        litros_agua: aguaNum,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() : null,
        observacoes: observacoes.trim() || null,
      })

      setPaciente(updated)
      setFeedbackSuccess('Alterações salvas com sucesso!')
      setTimeout(() => setFeedbackSuccess(''), 4000)
    } catch (err: any) {
      console.error('Erro ao atualizar dados do paciente:', err)
      setFeedbackError(err?.message || 'Erro ao salvar alterações no Neon.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Salva nova consulta (Seção 2)
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setConsultaError('')
    if (!novaConsultaData.data_consulta) {
      setConsultaError('A data da consulta é obrigatória.')
      return
    }

    if (!novaConsultaData.peso || parseFloat(novaConsultaData.peso.replace(',', '.')) <= 0) {
      setConsultaError('Informe o peso atual válido em kg.')
      return
    }

    setConsultaLoading(true)
    try {
      const pesoNum = parseFloat(novaConsultaData.peso.replace(',', '.'))
      const cinturaNum = novaConsultaData.cintura ? parseFloat(novaConsultaData.cintura.replace(',', '.')) : null
      const quadrilNum = novaConsultaData.quadril ? parseFloat(novaConsultaData.quadril.replace(',', '.')) : null
      const gorduraNum = novaConsultaData.percentual_gordura
        ? parseFloat(novaConsultaData.percentual_gordura.replace(',', '.'))
        : null

      const nova = await createConsulta({
        paciente_id: id,
        data_consulta: novaConsultaData.data_consulta,
        peso: pesoNum,
        cintura: cinturaNum,
        quadril: quadrilNum,
        percentual_gordura: gorduraNum,
        observacoes: novaConsultaData.observacoes.trim() || null,
        proximo_retorno: novaConsultaData.proximo_retorno || null,
      })

      // Atualiza lista de consultas em tempo real
      setConsultas((prev) => [nova, ...prev])

      // Se o peso inicial do paciente não existia ou o usuário desejar atualizar
      if (paciente) {
        setPaciente({
          ...paciente,
          ultima_consulta: nova.data_consulta,
        })
      }

      // Limpa formulário e fecha modal
      setNovaConsultaData({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: '',
      })
      setShowModalConsulta(false)
      setFeedbackSuccess('Consulta registrada com sucesso!')
      setTimeout(() => setFeedbackSuccess(''), 4000)
    } catch (err: any) {
      console.error('Erro ao salvar nova consulta:', err)
      setConsultaError(err?.message || 'Erro ao salvar consulta.')
    } finally {
      setConsultaLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-600">Carregando prontuário do paciente...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto mt-6">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          O paciente solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={() => navigate('/pacientes')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Lista de Pacientes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/pacientes')}
          className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Pacientes
        </Button>

        <div className="flex items-center gap-2 flex-wrap self-end xs:self-auto">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              E-mail
            </a>
          )}
        </div>
      </div>

      {/* Banner de Identificação do Paciente */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6 md:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0">
            {paciente.nome.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{paciente.nome}</h1>
              {sexo && (
                <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {sexo}
                </span>
              )}
              {idadeInfo && (
                <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  🎂 {idadeInfo.text}
                </span>
              )}
            </div>

            {/* Badges de Objetivos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Target className="w-4 h-4 text-emerald-600 shrink-0" />
              {objetivos.length > 0 ? (
                objetivos.map((obj, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100"
                  >
                    {obj}
                  </span>
                ))
              ) : objetivoTexto ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {objetivoTexto}
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">Objetivo não cadastrado</span>
              )}
            </div>
          </div>

          {/* Resumo de Consultas & Cadastro */}
          <div className="border-t pt-3.5 sm:border-t-0 sm:pt-0 sm:border-l sm:border-slate-100 sm:pl-6 flex flex-row sm:flex-col justify-between sm:justify-start gap-2 sm:gap-1.5 text-xs text-slate-500 shrink-0">
            <div>
              <span className="font-semibold text-slate-700 block">Cadastrado em:</span>
              <span>{formatDateBR(paciente.created_at)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 block">Última consulta:</span>
              <span className="text-emerald-700 font-bold">
                {consultas.length > 0 ? formatDateBR(consultas[0].data_consulta) : 'Nenhuma realizada'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Notificação Global */}
      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">{feedbackSuccess}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold text-sm">{feedbackError}</span>
        </div>
      )}

      {/* ========================================================
          NAVEGADOR DAS 3 SEÇÕES PRINCIPAIS (Prompt 5)
          ======================================================== */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 bg-white p-1 sm:p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Seção 1: Dados do Paciente */}
        <button
          type="button"
          onClick={() => setActiveSection('dados')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
            activeSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate hidden sm:inline">1. Dados do Paciente</span>
          <span className="truncate sm:hidden">1. Dados</span>
        </button>

        {/* Seção 2: Consultas */}
        <button
          type="button"
          onClick={() => setActiveSection('consultas')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
            activeSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate hidden sm:inline">2. Consultas ({consultas.length})</span>
          <span className="truncate sm:hidden">2. Consultas</span>
        </button>

        {/* Seção 3: Planos Alimentares */}
        <button
          type="button"
          onClick={() => setActiveSection('planos')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
            activeSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate hidden sm:inline">3. Planos Alimentares ({planos.length})</span>
          <span className="truncate sm:hidden">3. Planos</span>
        </button>
      </div>

      {/* ========================================================
          SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS EM 3 ABAS)
          ======================================================== */}
      {activeSection === 'dados' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub-navegador de abas (Pessoal, Clínico, Hábitos) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-white px-3.5 sm:px-4 py-2.5 rounded-t-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTabDados(1)}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTabDados === 1
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Pessoal
              </button>
              <button
                type="button"
                onClick={() => setActiveTabDados(2)}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTabDados === 2
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Clínico
              </button>
              <button
                type="button"
                onClick={() => setActiveTabDados(3)}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTabDados === 3
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Hábitos
              </button>
            </div>

            <Button
              type="button"
              onClick={() => handleSaveDados()}
              disabled={saveLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs w-full sm:w-auto justify-center h-9"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>

          <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden rounded-t-none">
            {/* ABA 1: PESSOAL */}
            {activeTabDados === 1 && (
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome Completo */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nome" className="text-slate-700 font-semibold">
                      Nome Completo *
                    </Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus-visible:ring-emerald-500 font-medium"
                    />
                  </div>

                  {/* Data de Nascimento */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dataNascimento" className="text-slate-700 font-medium">
                        Data de Nascimento
                      </Label>
                      {idadeInfo && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {idadeInfo.text}
                        </span>
                      )}
                    </div>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>

                  {/* Sexo */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium block">Sexo</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSexo(s)}
                          className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                            sexo === s
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold shadow-2xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-slate-700 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 98765-4321"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp" className="text-slate-700 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp
                      </Label>
                      {telefone && (
                        <button
                          type="button"
                          onClick={() => setWhatsapp(telefone)}
                          className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar do telefone
                        </button>
                      )}
                    </div>
                    <Input
                      id="whatsapp"
                      placeholder="(11) 98765-4321"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                      className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="paciente@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            )}

            {/* ABA 2: CLÍNICO */}
            {activeTabDados === 2 && (
              <CardContent className="p-6 space-y-6">
                {/* Peso, Altura e IMC Automático */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                  <div className="space-y-1.5">
                    <Label htmlFor="pesoKg" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                      Peso Atual / Inicial (kg)
                    </Label>
                    <div className="relative">
                      <Input
                        id="pesoKg"
                        type="number"
                        step="0.1"
                        placeholder="68.5"
                        value={pesoKg}
                        onChange={(e) => setPesoKg(e.target.value)}
                        className="pr-10 h-11 bg-white border-slate-200 font-medium"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="alturaCm" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                      Altura (cm)
                    </Label>
                    <div className="relative">
                      <Input
                        id="alturaCm"
                        type="number"
                        step="1"
                        placeholder="170"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        className="pr-10 h-11 bg-white border-slate-200 font-medium"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                      IMC Calculado (Automático)
                    </Label>
                    <div className="h-11 px-3 py-2 bg-white rounded-md border border-slate-200 flex items-center justify-between">
                      {imcInfo ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-base">{imcInfo.formatted}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${imcInfo.badge}`}>
                            {imcInfo.classification}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Preencha peso e altura</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold block">Objetivos Clínicos</Label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_OPCOES.map((obj) => {
                      const isSelected = objetivos.includes(obj)
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => handleToggleOption(objetivos, setObjetivos, obj)}
                          className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {obj}
                        </button>
                      )
                    })}
                  </div>
                  <Input
                    placeholder="Adicionar outro objetivo específico ou detalhes..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                    className="h-10 text-sm border-slate-200"
                  />
                </div>

                {/* Nível de Atividade */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold block">Nível de Atividade Física</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => setNivelAtividade(nivel)}
                        className={`py-2 px-2 rounded-xl border text-xs font-medium text-center transition-all ${
                          nivelAtividade === nivel
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-3 pt-2">
                  <Label className="text-slate-700 font-semibold block">Patologias ou Condições de Saúde</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleOption(patologias, setPatologias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        patologias.includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_OPCOES.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => handleToggleOption(patologias, setPatologias, pat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          patologias.includes(pat)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        {patologias.includes(pat) && '✓ '}
                        {pat}
                      </button>
                    ))}
                    {patologias
                      .filter((p) => !PATOLOGIAS_OPCOES.includes(p) && p !== 'Nenhum')
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(custom, patologias, setPatologias)}
                            className="hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar outra patologia..."
                      value={novaPatologia}
                      onChange={(e) => setNovaPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem(novaPatologia, setNovaPatologia, patologias, setPatologias)
                        }
                      }}
                      className="h-9 text-xs border-slate-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddCustomItem(novaPatologia, setNovaPatologia, patologias, setPatologias)}
                      className="shrink-0 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-3 pt-2">
                  <Label className="text-slate-700 font-semibold block">Restrições Alimentares</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleOption(restricoes, setRestricoes, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        restricoes.includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Nenhum
                    </button>
                    {RESTRICOES_OPCOES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleToggleOption(restricoes, setRestricoes, r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          restricoes.includes(r)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        {restricoes.includes(r) && '✓ '}
                        {r}
                      </button>
                    ))}
                    {restricoes
                      .filter((r) => !RESTRICOES_OPCOES.includes(r) && r !== 'Nenhum')
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(custom, restricoes, setRestricoes)}
                            className="hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar outra restrição alimentar..."
                      value={novaRestricao}
                      onChange={(e) => setNovaRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem(novaRestricao, setNovaRestricao, restricoes, setRestricoes)
                        }
                      }}
                      className="h-9 text-xs border-slate-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddCustomItem(novaRestricao, setNovaRestricao, restricoes, setRestricoes)}
                      className="shrink-0 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias */}
                <div className="space-y-3 pt-2">
                  <Label className="text-slate-700 font-semibold block">Alergias Alimentares</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleOption(alergias, setAlergias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        alergias.includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Nenhum
                    </button>
                    {ALERGIAS_OPCOES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleToggleOption(alergias, setAlergias, a)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          alergias.includes(a)
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'
                        }`}
                      >
                        {alergias.includes(a) && '✓ '}
                        {a}
                      </button>
                    ))}
                    {alergias
                      .filter((a) => !ALERGIAS_OPCOES.includes(a) && a !== 'Nenhum')
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(custom, alergias, setAlergias)}
                            className="hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar outra alergia alimentar..."
                      value={novaAlergia}
                      onChange={(e) => setNovaAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem(novaAlergia, setNovaAlergia, alergias, setAlergias)
                        }
                      }}
                      className="h-9 text-xs border-slate-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddCustomItem(novaAlergia, setNovaAlergia, alergias, setAlergias)}
                      className="shrink-0 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="medicamentos" className="text-slate-700 font-medium">
                      Medicamentos Contínuos
                    </Label>
                    <textarea
                      id="medicamentos"
                      rows={3}
                      placeholder="Ex: Puran T4 50mcg..."
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suplementos" className="text-slate-700 font-medium">
                      Suplementos em Uso
                    </Label>
                    <textarea
                      id="suplementos"
                      rows={3}
                      placeholder="Ex: Creatina 5g..."
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            )}

            {/* ABA 3: HÁBITOS */}
            {activeTabDados === 3 && (
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="refeicoes" className="text-slate-700 font-medium text-xs">
                      Refeições por Dia
                    </Label>
                    <Input
                      id="refeicoes"
                      type="number"
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      className="h-11 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="horarioAcorda" className="text-slate-700 font-medium text-xs flex items-center justify-between">
                      <span>Horário que Acorda</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ex: 6 → 06:00</span>
                    </Label>
                    <Input
                      id="horarioAcorda"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))}
                      className="h-11 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="horarioDorme" className="text-slate-700 font-medium text-xs flex items-center justify-between">
                      <span>Horário que Dorme</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ex: 23 → 23:00</span>
                    </Label>
                    <Input
                      id="horarioDorme"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))}
                      className="h-11 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="litrosAgua" className="text-slate-700 font-medium text-xs">
                      Água por Dia (Litros)
                    </Label>
                    <div className="relative">
                      <Input
                        id="litrosAgua"
                        type="number"
                        step="0.1"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        className="pr-14 h-11 border-slate-200"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pratica Atividade Física */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-800 font-semibold text-sm">
                        Pratica Atividade Física?
                      </Label>
                      <p className="text-xs text-slate-500">
                        Indique se o paciente realiza exercícios físicos regulares.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPraticaAtividade(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          !praticaAtividade
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => setPraticaAtividade(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          praticaAtividade
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </div>

                  {praticaAtividade && (
                    <div className="pt-2 animate-in fade-in space-y-1.5">
                      <Label htmlFor="atividadeDescricao" className="text-xs font-semibold text-emerald-800">
                        Qual atividade e frequência semanal?
                      </Label>
                      <Input
                        id="atividadeDescricao"
                        placeholder="Ex: Musculação 4x na semana e natação aos sábados"
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                        className="bg-white border-emerald-200 focus-visible:ring-emerald-500 h-10 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-slate-700 font-semibold">
                    Observações Gerais
                  </Label>
                  <textarea
                    id="observacoes"
                    rows={4}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </CardContent>
            )}

            {/* Rodapé com botão Salvar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => handleSaveDados()}
                disabled={saveLoading}
                className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 sm:h-9"
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando alterações...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================
          SEÇÃO 2 — CONSULTAS & EVOLUÇÃO DE PESO (Prompt 5)
          ======================================================== */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header da Seção de Consultas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Histórico de Consultas & Acompanhamento
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registre consultas, medidas antropométricas e visualize a evolução do peso ao longo do tratamento.
              </p>
            </div>

            <Button
              onClick={() => setShowModalConsulta(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
          </div>

          {/* Gráfico de Evolução de Peso (Sempre em Destaque) */}
          <WeightChart
            consultas={consultas}
            pesoInicial={paciente.peso_inicial}
            onNewConsulta={() => setShowModalConsulta(true)}
          />

          {/* Lista de Consultas em Ordem Decrescente */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800">
                  Registros de Consultas
                </CardTitle>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {consultas.length} {consultas.length === 1 ? 'consulta' : 'consultas'}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {consultas.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-500">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">Nenhuma consulta realizada</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Clique no botão "Nova Consulta" acima para adicionar a primeira avaliação.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {consultas.map((consulta, index) => {
                    // Cálculo de diferença de peso com a consulta anterior (mais antiga na linha do tempo)
                    const proximaMaisAntiga = consultas[index + 1]
                    const diffPeso = proximaMaisAntiga?.peso && consulta.peso
                      ? Number((Number(consulta.peso) - Number(proximaMaisAntiga.peso)).toFixed(1))
                      : null

                    return (
                      <div key={consulta.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Data e Peso */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                {formatDateBR(consulta.data_consulta)}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  Mais recente
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                              <div className="text-base font-extrabold text-slate-800">
                                {consulta.peso ? `${consulta.peso} kg` : 'Peso não anotado'}
                              </div>

                              {diffPeso !== null && (
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    diffPeso < 0
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : diffPeso > 0
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {diffPeso < 0 ? (
                                    <TrendingDown className="w-3 h-3" />
                                  ) : diffPeso > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : null}
                                  {diffPeso > 0 ? `+${diffPeso}` : diffPeso} kg
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Medidas Adicionais: Cintura, Quadril, % Gordura */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                            {consulta.cintura && (
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cintura</span>
                                <span className="font-semibold text-slate-800">{consulta.cintura} cm</span>
                              </div>
                            )}

                            {consulta.quadril && (
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Quadril</span>
                                <span className="font-semibold text-slate-800">{consulta.quadril} cm</span>
                              </div>
                            )}

                            {consulta.percentual_gordura && (
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">% Gordura</span>
                                <span className="font-semibold text-slate-800">{consulta.percentual_gordura}%</span>
                              </div>
                            )}

                            {consulta.proximo_retorno && (
                              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Próximo Retorno</span>
                                <span className="font-bold">{formatDateBR(consulta.proximo_retorno)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Observações da Consulta */}
                        {consulta.observacoes && (
                          <div className="mt-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100">
                            <span className="font-semibold text-slate-800 block mb-0.5">Observações da Consulta:</span>
                            <p className="whitespace-pre-line">{consulta.observacoes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          SEÇÃO 3 — PLANOS ALIMENTARES (Prompt 6 — IA Gemini)
          ======================================================== */}
      {activeSection === 'planos' && (
        <PlanoAlimentarSection
          paciente={paciente}
          planos={planos}
          onPlanoSaved={(novoPlano) => {
            setPlanos((prev) => [novoPlano, ...prev])
          }}
        />
      )}

      {/* ========================================================
          MODAL: FORMULÁRIO DE NOVA CONSULTA (Prompt 5)
          ======================================================== */}
      {showModalConsulta && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-emerald-600" />
                  Nova Consulta
                </h3>
                <p className="text-xs text-slate-500">
                  Paciente: <span className="font-semibold text-slate-700">{paciente.nome}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalConsulta(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsulta} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {consultaError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {consultaError}
                </div>
              )}

              {/* Data da Consulta & Peso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="data_consulta" className="text-xs font-semibold text-slate-700">
                    Data da Consulta *
                  </Label>
                  <Input
                    id="data_consulta"
                    type="date"
                    required
                    value={novaConsultaData.data_consulta}
                    onChange={(e) =>
                      setNovaConsultaData({ ...novaConsultaData, data_consulta: e.target.value })
                    }
                    className="h-10 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="peso" className="text-xs font-semibold text-slate-700">
                    Peso Atual (kg) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 68.5"
                      required
                      value={novaConsultaData.peso}
                      onChange={(e) => setNovaConsultaData({ ...novaConsultaData, peso: e.target.value })}
                      className="h-10 pr-10 border-slate-200"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Medidas: Cintura, Quadril, % Gordura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="cintura" className="text-xs text-slate-600">
                    Cintura (cm) <span className="text-[10px] text-slate-400">opcional</span>
                  </Label>
                  <Input
                    id="cintura"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 78"
                    value={novaConsultaData.cintura}
                    onChange={(e) => setNovaConsultaData({ ...novaConsultaData, cintura: e.target.value })}
                    className="h-9 border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quadril" className="text-xs text-slate-600">
                    Quadril (cm) <span className="text-[10px] text-slate-400">opcional</span>
                  </Label>
                  <Input
                    id="quadril"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 98"
                    value={novaConsultaData.quadril}
                    onChange={(e) => setNovaConsultaData({ ...novaConsultaData, quadril: e.target.value })}
                    className="h-9 border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gordura" className="text-xs text-slate-600">
                    % Gordura <span className="text-[10px] text-slate-400">opcional</span>
                  </Label>
                  <Input
                    id="gordura"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 21.5"
                    value={novaConsultaData.percentual_gordura}
                    onChange={(e) =>
                      setNovaConsultaData({ ...novaConsultaData, percentual_gordura: e.target.value })
                    }
                    className="h-9 border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Próximo Retorno */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="proximo_retorno" className="text-xs font-semibold text-slate-700">
                  Data do Próximo Retorno <span className="text-[10px] text-slate-400 font-normal">opcional</span>
                </Label>
                <Input
                  id="proximo_retorno"
                  type="date"
                  value={novaConsultaData.proximo_retorno}
                  onChange={(e) =>
                    setNovaConsultaData({ ...novaConsultaData, proximo_retorno: e.target.value })
                  }
                  className="h-10 border-slate-200"
                />
              </div>

              {/* Observações da Consulta */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="obs_consulta" className="text-xs font-semibold text-slate-700">
                  Observações e Evolução Clínica
                </Label>
                <textarea
                  id="obs_consulta"
                  rows={3}
                  placeholder="Relato do paciente, aderência à dieta, bioimpedância, ajuste calórico..."
                  value={novaConsultaData.observacoes}
                  onChange={(e) =>
                    setNovaConsultaData({ ...novaConsultaData, observacoes: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Botões de Ação do Modal */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModalConsulta(false)}
                  className="text-slate-600 justify-center h-10 xs:h-9"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={consultaLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold justify-center h-10 xs:h-9"
                >
                  {consultaLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Consulta'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}
