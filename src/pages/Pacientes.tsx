import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getNutricionistaByEmail, getPacientes, Paciente } from '@/lib/db'
import { formatDateBR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  UserPlus,
  Search,
  ChevronRight,
  Target,
  Clock,
  Sparkles,
  UserX,
  Loader2,
  RefreshCw,
} from 'lucide-react'

export function Pacientes() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPacientes = async (showRefreshing = false) => {
    if (!user?.email) return
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      const nutri = await getNutricionistaByEmail(user.email)
      if (nutri?.id) {
        const data = await getPacientes(nutri.id)
        setPacientes(data)
      }
    } catch (err) {
      console.error('Erro ao carregar lista de pacientes:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPacientes()
  }, [user?.email])

  // Filtro de busca por nome ou objetivo
  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const matchNome = p.nome.toLowerCase().includes(term)
    const matchEmail = p.email ? p.email.toLowerCase().includes(term) : false
    const matchObjetivo = p.objetivos ? p.objetivos.some((obj) => obj.toLowerCase().includes(term)) : false
    const matchObjetivoTexto = p.objetivo_texto ? p.objetivo_texto.toLowerCase().includes(term) : false
    return matchNome || matchEmail || matchObjetivo || matchObjetivoTexto
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 mb-1.5">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Gestão Clínica
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Pacientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulte a lista de pacientes cadastrados e acompanhe seus objetivos e histórico.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPacientes(true)}
            disabled={refreshing || loading}
            className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={() => navigate('/pacientes/novo')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold transition-all hover:shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Card Principal da Listagem */}
      <Card className="border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                Listagem de Pacientes
                {!loading && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Clique em um paciente para abrir seu perfil clínico completo.
              </CardDescription>
            </div>

            {/* Campo de Busca por Nome */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Buscar paciente por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white text-sm border-slate-200 focus-visible:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full px-1.5 py-0.5"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-slate-600">Carregando pacientes cadastrados...</p>
            </div>
          ) : pacientes.length === 0 ? (
            /* Estado Vazio — Nenhum paciente cadastrado ainda */
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nenhum paciente cadastrado ainda</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                Comece agora mesmo cadastrando o seu primeiro paciente para organizar prontuários, hábitos e consultas.
              </p>
              <Button
                onClick={() => navigate('/pacientes/novo')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Paciente
              </Button>
            </div>
          ) : filteredPacientes.length === 0 ? (
            /* Nenhum paciente encontrado na busca */
            <div className="text-center py-12 px-4 text-slate-500">
              <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">Nenhum paciente encontrado para "{searchTerm}"</p>
              <p className="text-xs text-slate-400 mt-1">Verifique a ortografia ou limpe a busca.</p>
            </div>
          ) : (
            /* Lista de Pacientes */
            <div className="divide-y divide-slate-100">
              {filteredPacientes.map((paciente) => {
                // Formatação do objetivo principal para exibição
                const displayObjetivos = paciente.objetivos && paciente.objetivos.length > 0
                  ? paciente.objetivos
                  : paciente.objetivo_texto
                  ? [paciente.objetivo_texto]
                  : []

                return (
                  <div
                    key={paciente.id}
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    className="p-4 sm:px-6 hover:bg-emerald-50/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Informações Principais: Nome e Avatar */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        {paciente.nome.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-base group-hover:text-emerald-700 transition-colors truncate">
                            {paciente.nome}
                          </h4>
                          {paciente.sexo && (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                              {paciente.sexo}
                            </span>
                          )}
                        </div>

                        {/* Objetivo do paciente */}
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {displayObjetivos.length > 0 ? (
                            displayObjetivos.slice(0, 3).map((obj, i) => (
                              <span
                                key={i}
                                className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 truncate max-w-[200px]"
                              >
                                {obj}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Objetivo não informado</span>
                          )}
                          {displayObjetivos.length > 3 && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              +{displayObjetivos.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Data da Última Consulta e Botão de Ação */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-14 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center sm:justify-end gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Última consulta
                        </span>
                        <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                          {paciente.ultima_consulta ? (
                            formatDateBR(paciente.ultima_consulta)
                          ) : (
                            <span className="text-slate-400 font-normal">Nenhuma consulta</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center text-emerald-600 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all text-sm font-medium">
                        <span className="hidden md:inline mr-1 text-xs">Ver perfil</span>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
