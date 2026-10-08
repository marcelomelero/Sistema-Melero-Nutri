import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getNutricionistaByEmail, createPaciente } from '@/lib/db'
import { formatPhone, formatTimeInput, calculateAge, calculateIMC } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  HeartPulse,
  Coffee,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Phone,
  MessageSquare,
  Calculator,
  Loader2,
  Copy,
} from 'lucide-react'

// Opções padrão conforme o Prompt 4
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

export function NovoPaciente() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Aba ativa: 1 = Pessoal, 2 = Clínico, 3 = Hábitos
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Aba 1 — Pessoal
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  // Aba 2 — Clínico
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

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState('')
  const [praticaAtividade, setPraticaAtividade] = useState<boolean>(false)
  const [atividadeDescricao, setAtividadeDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Cálculos dinâmicos
  const idadeInfo = useMemo(() => calculateAge(dataNascimento), [dataNascimento])
  const imcInfo = useMemo(() => calculateIMC(pesoKg, alturaCm), [pesoKg, alturaCm])

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

  const handleCopyPhoneToWhatsapp = () => {
    if (telefone) {
      setWhatsapp(telefone)
    }
  }

  // Submissão do Formulário
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')

    if (!nome.trim()) {
      setActiveTab(1)
      setErrorMessage('O campo Nome Completo é obrigatório.')
      return
    }

    if (!user?.email) {
      setErrorMessage('Nutricionista não autenticado. Faça login novamente.')
      return
    }

    setLoading(true)

    try {
      const nutri = await getNutricionistaByEmail(user.email)
      if (!nutri?.id) {
        throw new Error('Não foi possível identificar a nutricionista logada.')
      }

      const pesoNum = pesoKg ? parseFloat(pesoKg.replace(',', '.')) : null
      const alturaNum = alturaCm ? parseFloat(alturaCm.replace(',', '.')) : null
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null
      const aguaNum = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null

      const newPatient = await createPaciente({
        nutricionista_id: nutri.id,
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

      setSuccessMessage('Paciente cadastrado com sucesso! Redirecionando para o perfil...')

      // Redireciona para o perfil do paciente recém-criado
      setTimeout(() => {
        navigate(`/pacientes/${newPatient.id}`)
      }, 1200)
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err)
      setErrorMessage(err?.message || 'Erro ao cadastrar paciente. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header com botão de voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pacientes')}
            className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Cadastrar Novo Paciente
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Preencha os dados organizados em Pessoal, Clínico e Hábitos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Paciente
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas de Notificação */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Navegador das 3 Abas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Aba 1 */}
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
            activeTab === 1
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">1. Pessoal</span>
          {nome.trim() && (
            <span className={`w-2 h-2 rounded-full ${activeTab === 1 ? 'bg-white' : 'bg-emerald-500'} shrink-0`} />
          )}
        </button>

        {/* Aba 2 */}
        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
            activeTab === 2
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HeartPulse className="w-4 h-4 shrink-0" />
          <span className="truncate">2. Clínico</span>
          {(pesoKg || objetivos.length > 0) && (
            <span className={`w-2 h-2 rounded-full ${activeTab === 2 ? 'bg-white' : 'bg-emerald-500'} shrink-0`} />
          )}
        </button>

        {/* Aba 3 */}
        <button
          type="button"
          onClick={() => setActiveTab(3)}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
            activeTab === 3
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4 shrink-0" />
          <span className="truncate">3. Hábitos</span>
          {(refeicoesPorDia || litrosAgua) && (
            <span className={`w-2 h-2 rounded-full ${activeTab === 3 ? 'bg-white' : 'bg-emerald-500'} shrink-0`} />
          )}
        </button>
      </div>

      <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
        {/* ========================================================
            ABA 1: DADOS PESSOAIS
            ======================================================== */}
        {activeTab === 1 && (
          <div className="animate-in fade-in duration-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800">Dados Pessoais</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Identificação e contatos do paciente. O único campo obrigatório é o nome completo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Completo (Obrigatório) */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome" className="text-slate-700 font-semibold flex items-center justify-between">
                    <span>Nome Completo <span className="text-emerald-600 font-bold">*</span></span>
                    <span className="text-[11px] text-emerald-600 font-normal">Campo obrigatório</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Mariana Albuquerque Santos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="h-11 text-base border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Data de Nascimento com cálculo automático da idade */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dataNascimento" className="text-slate-700 font-medium">
                      Data de Nascimento
                    </Label>
                    {idadeInfo && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                        onClick={handleCopyPhoneToWhatsapp}
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

              {/* Botões do Rodapé da Aba 1 */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/pacientes')}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Próximo: Clínico
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* ========================================================
            ABA 2: DADOS CLÍNICOS
            ======================================================== */}
        {activeTab === 2 && (
          <div className="animate-in fade-in duration-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800">Avaliação Clínica e Antropométrica</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Medidas corporais, IMC automático, objetivos clínicos, patologias e alergias.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Peso, Altura e IMC Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                {/* Peso Atual */}
                <div className="space-y-1.5">
                  <Label htmlFor="pesoKg" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    Peso Atual (kg)
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

                {/* Altura Atual */}
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

                {/* IMC Calculado (Somente Leitura) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      IMC (Automático)
                    </Label>
                  </div>
                  <div className="h-11 px-3 py-2 bg-white rounded-md border border-slate-200 flex items-center justify-between">
                    {imcInfo ? (
                      <>
                        <span className="font-extrabold text-slate-800 text-base">
                          {imcInfo.formatted}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${imcInfo.badge}`}>
                          {imcInfo.classification}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Preencha peso e altura
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Objetivos (Múltipla Escolha + Texto Livre Adicional) */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold block">
                  Objetivo Principal <span className="text-slate-400 text-xs font-normal">(selecione um ou mais)</span>
                </Label>
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
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {obj}
                      </button>
                    )
                  })}
                </div>

                <div className="pt-1">
                  <Input
                    placeholder="Adicionar outro objetivo específico ou detalhes..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                    className="h-10 text-sm border-slate-200"
                  />
                </div>
              </div>

              {/* Nível de Atividade Física */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold block">
                  Nível de Atividade Física
                </Label>
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

              {/* Patologias ou Condições de Saúde */}
              <div className="space-y-3 pt-2">
                <Label className="text-slate-700 font-semibold block">
                  Patologias ou Condições de Saúde
                </Label>
                <div className="flex flex-wrap gap-2">
                  {/* Opção Nenhum */}
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

                  {PATOLOGIAS_OPCOES.map((pat) => {
                    const isSelected = patologias.includes(pat)
                    return (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => handleToggleOption(patologias, setPatologias, pat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {pat}
                      </button>
                    )
                  })}

                  {/* Itens adicionados livremente */}
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
                    placeholder="Adicionar outra patologia ou condição..."
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
                <Label className="text-slate-700 font-semibold block">
                  Restrições Alimentares
                </Label>
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

                  {RESTRICOES_OPCOES.map((rest) => {
                    const isSelected = restricoes.includes(rest)
                    return (
                      <button
                        key={rest}
                        type="button"
                        onClick={() => handleToggleOption(restricoes, setRestricoes, rest)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {rest}
                      </button>
                    )
                  })}

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

              {/* Alergias Alimentares */}
              <div className="space-y-3 pt-2">
                <Label className="text-slate-700 font-semibold block">
                  Alergias Alimentares
                </Label>
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

                  {ALERGIAS_OPCOES.map((al) => {
                    const isSelected = alergias.includes(al)
                    return (
                      <button
                        key={al}
                        type="button"
                        onClick={() => handleToggleOption(alergias, setAlergias, al)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {al}
                      </button>
                    )
                  })}

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
                    placeholder="Ex: Puran T4 50mcg em jejum, Losartana 50mg..."
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
                    placeholder="Ex: Creatina 5g pós-treino, Whey Protein isolado, Vitamina D..."
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botões do Rodapé da Aba 2 */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(1)}
                  className="text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Voltar: Pessoal
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Próximo: Hábitos
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* ========================================================
            ABA 3: HÁBITOS E ROTINA
            ======================================================== */}
        {activeTab === 3 && (
          <div className="animate-in fade-in duration-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800">Hábitos e Rotina de Vida</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Número de refeições, horários de sono, ingestão de água e atividade física.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Refeições por Dia */}
                <div className="space-y-1.5">
                  <Label htmlFor="refeicoes" className="text-slate-700 font-medium text-xs">
                    Refeições por Dia
                  </Label>
                  <Input
                    id="refeicoes"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Ex: 4"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Horário que Acorda */}
                <div className="space-y-1.5">
                  <Label htmlFor="horarioAcorda" className="text-slate-700 font-medium text-xs flex items-center justify-between">
                    <span>Horário que Acorda</span>
                    <span className="text-[10px] text-slate-400 font-normal">Ex: 6 → 06:00</span>
                  </Label>
                  <Input
                    id="horarioAcorda"
                    placeholder="06:30"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))}
                    className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Horário que Dorme */}
                <div className="space-y-1.5">
                  <Label htmlFor="horarioDorme" className="text-slate-700 font-medium text-xs flex items-center justify-between">
                    <span>Horário que Dorme</span>
                    <span className="text-[10px] text-slate-400 font-normal">Ex: 23 → 23:00</span>
                  </Label>
                  <Input
                    id="horarioDorme"
                    placeholder="23:00"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))}
                    className="h-11 border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Ingestão de Água */}
                <div className="space-y-1.5">
                  <Label htmlFor="litrosAgua" className="text-slate-700 font-medium text-xs">
                    Água por Dia (Litros)
                  </Label>
                  <div className="relative">
                    <Input
                      id="litrosAgua"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      className="pr-14 h-11 border-slate-200 focus-visible:ring-emerald-500"
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
                      placeholder="Ex: Musculação 4x por semana e corrida aos sábados"
                      value={atividadeDescricao}
                      onChange={(e) => setAtividadeDescricao(e.target.value)}
                      className="bg-white border-emerald-200 focus-visible:ring-emerald-500 h-10 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-slate-700 font-semibold">
                  Observações Gerais
                </Label>
                <textarea
                  id="observacoes"
                  rows={4}
                  placeholder="Informações complementares, preferências alimentares, histórico familiar ou anotações da consulta inicial..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Botões do Rodapé da Aba 3 */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(2)}
                  className="text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Voltar: Clínico
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-emerald-600/25 px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Paciente
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  )
}
